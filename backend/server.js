require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = 5000;
const mongoURL = "mongodb://127.0.0.1:27017";
const client = new MongoClient(mongoURL);
let db;

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
        if (error) {
            return res.status(403).json({
                message: "Invalid or expired token"
            });
        }

        req.user = user;
        next();
    });
}

function authorizeRole(role) {
    return (req, res, next) => {
        if (req.user.role !== role) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
}
app.use(cors());
app.use(express.json());

function generateToken(user) {
    return jwt.sign(
        {
            id: user.student_id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
    );
}

app.get("/", (req, res) => {
    res.send("InnoBridge Backend is running!");
});
app.post("/api/ideas", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can create ideas"
            });
        }

        const {
            title,
            description,
            category,
            requiredSkills,
            technologyStack,
            problemStatement,
            expectedOutcome,
            status
        } = req.body;

        if (!title || !description || !category || !requiredSkills || !technologyStack || !problemStatement || !expectedOutcome) {
            return res.status(400).json({
                message: "All required fields must be provided"
            });
        }

        const lastIdea = await db.collection("ideas")
            .find()
            .sort({ idea_id: -1 })
            .limit(1)
            .toArray();

        const idea_id = lastIdea.length > 0 ? lastIdea[0].idea_id + 1 : 1;

        const idea = {
            idea_id,
            student_id: req.user.student_id,
            title,
            description,
            category,
            requiredSkills,
            technologyStack,
            problemStatement,
            expectedOutcome,
            status: status || "open",
            created_at: new Date()
        };

        await db.collection("ideas").insertOne(idea);

        res.status(201).json({
            message: "Idea created successfully",
            idea_id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});
app.post("/api/students", async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            phone,
            department,
            year,
            skills,
            bio,
            profile_photo
        } = req.body;

        const existingStudent = await db.collection("students")
            .findOne({ email: email });

        if (existingStudent) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const lastStudent = await db.collection("students")
            .find({})
            .sort({ student_id: -1 })
            .limit(1)
            .toArray();

        const nextStudentId =
            lastStudent.length > 0
                ? lastStudent[0].student_id + 1
                : 1;

        const student = {
            student_id: nextStudentId,
            first_name,
            last_name,
            email,
            password: hashedPassword,
            phone,
            department,
            year,
            skills,
            bio,
            profile_photo,
            created_at: new Date()
        };

        await db.collection("students").insertOne(student);

        res.status(201).json({
            message: "Student registered successfully",
            student_id: student.student_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to register student"
        });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const student = await db.collection("students").findOne({
            email: email
        });

        if (!student) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            student.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                student_id: student.student_id,
                email: student.email,
                role: "student"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            student_id: student.student_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Login failed"
        });
    }
});

app.post("/api/mentor-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const mentor = await db.collection("mentors").findOne({ email });

        if (!mentor) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(password, mentor.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                mentor_id: mentor.mentor_id,
                email: mentor.email,
                role: "mentor"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token: token,
            mentor_id: mentor.mentor_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Login failed"
        });
    }
});

app.post("/api/mentors", async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            phone,
            expertise,
            organization,
            designation,
            experience,
            bio,
            profile_photo
        } = req.body;

        const lastMentor = await db.collection("mentors")
            .find({})
            .sort({ mentor_id: -1 })
            .limit(1)
            .toArray();

        const nextMentorId =
            lastMentor.length > 0
                ? lastMentor[0].mentor_id + 1
                : 1;

        const hashedPassword = await bcrypt.hash(password, 10);

        const mentor = {
            mentor_id: nextMentorId,
            first_name,
            last_name,
            email,
            password: hashedPassword,
            phone,
            expertise,
            organization,
            designation,
            experience,
            bio,
            profile_photo,
            created_at: new Date()
        };

        await db.collection("mentors").insertOne(mentor);

        res.status(201).json({
            message: "Mentor created successfully",
            mentor_id: mentor.mentor_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create mentor"
        });
    }
});

app.post("/api/teams", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can create teams"
            });
        }

        const {
            idea_id,
            team_name,
            team_description
        } = req.body;

        const student_id = req.user.student_id;

        const idea = await db.collection("ideas").findOne({
            _id: new ObjectId(idea_id)
        });

        if (!idea) {
            return res.status(404).json({
                message: "Idea not found"
            });
        }

        if (idea.student_id !== student_id) {
            return res.status(403).json({
                message: "You can only create a team for your own idea"
            });
        }

        const lastTeam = await db.collection("teams")
            .find({})
            .sort({ team_id: -1 })
            .limit(1)
            .toArray();

        const nextTeamId =
            lastTeam.length > 0 ? lastTeam[0].team_id + 1 : 1;

        const team = {
            team_id: nextTeamId,
            idea_id: idea_id,
            team_name: team_name,
            team_description: team_description,
            created_at: new Date()
        };

        await db.collection("teams").insertOne(team);

        res.status(201).json({
            message: "Team created successfully",
            team_id: team.team_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create team"
        });
    }
});

app.post("/api/team-members", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can add team members"
            });
        }

        const {
            team_id,
            student_id
        } = req.body;

        const loggedInStudentId = req.user.student_id;

        const team = await db.collection("teams").findOne({
            team_id: parseInt(team_id)
        });

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        const idea = await db.collection("ideas").findOne({
            _id: new ObjectId(team.idea_id)
        });

        if (!idea) {
            return res.status(404).json({
                message: "Associated idea not found"
            });
        }

        if (idea.student_id !== loggedInStudentId) {
            return res.status(403).json({
                message: "Only the idea owner can add team members"
            });
        }

        const student = await db.collection("students").findOne({
            student_id: parseInt(student_id)
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const existingMember = await db.collection("team_members").findOne({
            team_id: parseInt(team_id),
            student_id: parseInt(student_id)
        });

        if (existingMember) {
            return res.status(400).json({
                message: "Student is already a team member"
            });
        }

        const memberCount = await db.collection("team_members").countDocuments();

        const teamMember = {
            team_member_id: memberCount + 1,
            team_id: parseInt(team_id),
            student_id: parseInt(student_id),
            joined_at: new Date()
        };

        await db.collection("team_members").insertOne(teamMember);

        res.status(201).json({
            message: "Team member added successfully",
            team_member_id: teamMember.team_member_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add team member"
        });
    }
});
app.post("/api/team-members", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can add team members"
            });
        }

        const {
            team_id,
            student_id
        } = req.body;

        const loggedInStudentId = req.user.student_id;

        const team = await db.collection("teams").findOne({
            team_id: parseInt(team_id)
        });

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        const idea = await db.collection("ideas").findOne({
            _id: new ObjectId(team.idea_id)
        });

        if (!idea) {
            return res.status(404).json({
                message: "Associated idea not found"
            });
        }

        if (idea.student_id !== loggedInStudentId) {
            return res.status(403).json({
                message: "Only the idea owner can add team members"
            });
        }

        const student = await db.collection("students").findOne({
            student_id: parseInt(student_id)
        });

        if (!student) {
            return res.status(404).json({
                message: "Student not found"
            });
        }

        const existingMember = await db.collection("team_members").findOne({
            team_id: parseInt(team_id),
            student_id: parseInt(student_id)
        });

        if (existingMember) {
            return res.status(400).json({
                message: "Student is already a team member"
            });
        }

        const memberCount = await db.collection("team_members").countDocuments();

        const teamMember = {
            team_member_id: memberCount + 1,
            team_id: parseInt(team_id),
            student_id: parseInt(student_id),
            joined_at: new Date()
        };

        await db.collection("team_members").insertOne(teamMember);

        res.status(201).json({
            message: "Team member added successfully",
            team_member_id: teamMember.team_member_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add team member"
        });
    }
});
app.post("/api/progress", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can update progress"
            });
        }

        const { team_id, progress_percentage, description } = req.body;

        const team = await db.collection("teams").findOne({
            team_id: parseInt(team_id)
        });

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        const progressCount = await db.collection("progress").countDocuments();

        const progress = {
            progress_id: progressCount + 1,
            team_id: parseInt(team_id),
            progress_percentage: progress_percentage,
            description: description,
            updated_at: new Date()
        };

        await db.collection("progress").insertOne(progress);

        res.status(201).json({
            message: "Progress updated successfully",
            progress_id: progress.progress_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update progress"
        });
    }
});
// ======================================================
// NOTIFICATIONS
// ======================================================

// Create a notification
app.post("/api/notifications", authenticateToken, async (req, res) => {
    try {
        const { user_id, user_role, message, type } = req.body;

        if (!user_id || !user_role || !message) {
            return res.status(400).json({
                message: "user_id, user_role and message are required"
            });
        }

        const notificationCount =
            await db.collection("notifications").countDocuments();

        const notification = {
            notification_id: notificationCount + 1,
            user_id: parseInt(user_id),
            user_role: user_role,
            message: message,
            type: type || "general",
            is_read: false,
            created_at: new Date()
        };

        await db.collection("notifications").insertOne(notification);

        res.status(201).json({
            message: "Notification created successfully",
            notification_id: notification.notification_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create notification"
        });
    }
});


// Get notifications for logged-in student
app.get("/api/student/notifications", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can view student notifications"
            });
        }

        const notifications = await db.collection("notifications")
            .find({
                user_id: req.user.student_id,
                user_role: "student"
            })
            .sort({ created_at: -1 })
            .toArray();

        res.status(200).json(notifications);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch notifications"
        });
    }
});


// Get notifications for logged-in mentor
app.get("/api/mentor/notifications", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "mentor") {
            return res.status(403).json({
                message: "Only mentors can view mentor notifications"
            });
        }

        const notifications = await db.collection("notifications")
            .find({
                user_id: req.user.mentor_id,
                user_role: "mentor"
            })
            .sort({ created_at: -1 })
            .toArray();

        res.status(200).json(notifications);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch notifications"
        });
    }
});


// Mark one notification as read
app.put("/api/notifications/:notification_id/read", authenticateToken, async (req, res) => {
    try {
        const notification_id = parseInt(req.params.notification_id);

        const user_id =
            req.user.role === "student"
                ? req.user.student_id
                : req.user.mentor_id;

        const notification = await db.collection("notifications").findOne({
            notification_id: notification_id,
            user_id: user_id,
            user_role: req.user.role
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        await db.collection("notifications").updateOne(
            { notification_id: notification_id },
            {
                $set: {
                    is_read: true,
                    read_at: new Date()
                }
            }
        );

        res.status(200).json({
            message: "Notification marked as read"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update notification"
        });
    }
});


// Mark all notifications as read
app.put("/api/notifications/read-all", authenticateToken, async (req, res) => {
    try {
        const user_id =
            req.user.role === "student"
                ? req.user.student_id
                : req.user.mentor_id;

        const result = await db.collection("notifications").updateMany(
            {
                user_id: user_id,
                user_role: req.user.role,
                is_read: false
            },
            {
                $set: {
                    is_read: true,
                    read_at: new Date()
                }
            }
        );

        res.status(200).json({
            message: "All notifications marked as read",
            updated_count: result.modifiedCount
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to update notifications"
        });
    }
});
// ======================================================
// PRIVACY SETTINGS
// ======================================================

// Create or update privacy settings for an idea
app.post("/api/privacy-settings", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can manage privacy settings"
            });
        }

        const { idea_id, visibility } = req.body;
        const student_id = req.user.student_id;

        if (!idea_id || !visibility) {
            return res.status(400).json({
                message: "idea_id and visibility are required"
            });
        }

        if (!["public", "private"].includes(visibility)) {
            return res.status(400).json({
                message: "Visibility must be public or private"
            });
        }

        const idea = await db.collection("ideas").findOne({
            idea_id: parseInt(idea_id)
        });

        if (!idea) {
            return res.status(404).json({
                message: "Idea not found"
            });
        }

        if (idea.student_id !== student_id) {
            return res.status(403).json({
                message: "You can only change privacy settings for your own idea"
            });
        }

        const existingSettings = await db.collection("privacy_settings").findOne({
            idea_id: parseInt(idea_id)
        });

        if (existingSettings) {
            await db.collection("privacy_settings").updateOne(
                { idea_id: parseInt(idea_id) },
                {
                    $set: {
                        visibility: visibility,
                        updated_at: new Date()
                    }
                }
            );

            return res.status(200).json({
                message: "Privacy settings updated successfully"
            });
        }

        const settingsCount =
            await db.collection("privacy_settings").countDocuments();

        const privacySettings = {
            privacy_id: settingsCount + 1,
            idea_id: parseInt(idea_id),
            student_id: student_id,
            visibility: visibility,
            created_at: new Date(),
            updated_at: new Date()
        };

        await db.collection("privacy_settings").insertOne(privacySettings);

        res.status(201).json({
            message: "Privacy settings created successfully",
            privacy_id: privacySettings.privacy_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to save privacy settings"
        });
    }
});


// Get privacy settings for an idea
app.get("/api/privacy-settings/:idea_id", authenticateToken, async (req, res) => {
    try {
        const idea_id = parseInt(req.params.idea_id);

        const settings = await db.collection("privacy_settings").findOne({
            idea_id: idea_id
        });

        if (!settings) {
            return res.status(404).json({
                message: "Privacy settings not found"
            });
        }

        // Only the owner can view the privacy settings
        if (req.user.role !== "student" ||
            settings.student_id !== req.user.student_id) {
            return res.status(403).json({
                message: "You are not allowed to view these privacy settings"
            });
        }

        res.status(200).json(settings);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch privacy settings"
        });
    }
});
// ======================================================
// FEEDBACK RETRIEVAL
// ======================================================

// Student views feedback received for their team's
app.get("/api/student/feedback", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can view feedback"
            });
        }

        const student_id = req.user.student_id;

        // Find teams where the student is a member
        const memberships = await db.collection("team_members")
            .find({ student_id: student_id })
            .toArray();

        const teamIds = memberships.map(member => member.team_id);

        const feedback = await db.collection("feedback")
            .find({ team_id: { $in: teamIds } })
            .sort({ created_at: -1 })
            .toArray();

        res.status(200).json(feedback);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch student feedback"
        });
    }
});


// Mentor views feedback submitted by themselves
app.get("/api/mentor/feedback", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "mentor") {
            return res.status(403).json({
                message: "Only mentors can view feedback"
            });
        }

        const mentor_id = req.user.mentor_id;

        const feedback = await db.collection("feedback")
            .find({ mentor_id: mentor_id })
            .sort({ created_at: -1 })
            .toArray();

        res.status(200).json(feedback);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch mentor feedback"
        });
    }
});
app.get("/api/auth-test", authenticateToken, (req, res) => {
    res.json({
        message: "Authentication successful",
        user: req.user
    });
});

app.get("/api/ideas", async (req, res) => {
    try {
        const ideas = await db.collection("ideas").find().toArray();
        const visibleIdeas = [];

        for (const idea of ideas) {
            const privacy = await db.collection("privacy_settings").findOne({
                idea_id: idea.idea_id
            });

            if (!privacy || privacy.visibility === "public") {
                visibleIdeas.push(idea);
            }
        }

        res.json(visibleIdeas);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/api/teams", authenticateToken, async (req, res) => {
    try {
        const teams = await db.collection("teams")
            .find({})
            .toArray();

        res.status(200).json(teams);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch teams"
        });
    }
});
app.get("/api/team-members", authenticateToken, async (req, res) => {
    try {
        const teamMembers = await db.collection("team_members")
            .find({})
            .toArray();

        res.status(200).json(teamMembers);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch team members"
        });
    }
});
app.get("/api/student/teams", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can view their teams"
            });
        }

        const student_id = req.user.student_id;

        const memberships = await db.collection("team_members")
            .find({ student_id: student_id })
            .toArray();

        const teamIds = memberships.map(member => member.team_id);

        const teams = await db.collection("teams")
            .find({ team_id: { $in: teamIds } })
            .toArray();

        res.status(200).json(teams);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch student teams"
        });
    }
});
app.get("/api/teams/:team_id", authenticateToken, async (req, res) => {
    try {
        const team_id = parseInt(req.params.team_id);

        const team = await db.collection("teams").findOne({
            team_id: team_id
        });

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        const idea = await db.collection("ideas").findOne({
            _id: new ObjectId(team.idea_id)
        });

        const members = await db.collection("team_members")
            .find({ team_id: team_id })
            .toArray();

        res.status(200).json({
            team: team,
            idea: idea,
            members: members
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch team details"
        });
    }
});
app.get("/api/progress/:team_id", authenticateToken, async (req, res) => {
    try {
        const team_id = parseInt(req.params.team_id);

        const team = await db.collection("teams").findOne({
            team_id: team_id
        });

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        const progress = await db.collection("progress")
            .find({ team_id: team_id })
            .sort({ updated_at: -1 })
            .toArray();

        res.status(200).json(progress);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch progress"
        });
    }
});
app.post("/api/feedback", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "mentor") {
            return res.status(403).json({
                message: "Only mentors can provide feedback"
            });
        }

        const { team_id, feedback } = req.body;
        const mentor_id = req.user.mentor_id;

        const team = await db.collection("teams").findOne({
            team_id: parseInt(team_id)
        });

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        const feedbackCount = await db.collection("feedback").countDocuments();

        const feedbackData = {
            feedback_id: feedbackCount + 1,
            team_id: parseInt(team_id),
            mentor_id: mentor_id,
            feedback: feedback,
            created_at: new Date()
        };

        await db.collection("feedback").insertOne(feedbackData);

        res.status(201).json({
            message: "Feedback submitted successfully",
            feedback_id: feedbackData.feedback_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to submit feedback"
        });
    }
});
// ======================================================
// COLLABORATION / MENTORSHIP REQUESTS
// ======================================================

// Student sends a guidance request to a mentor
app.post("/api/collaboration-requests", authenticateToken, async (req, res) => {
    try {
        // Only students can send guidance requests
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can send guidance requests"
            });
        }

        const { idea_id, mentor_id } = req.body;

        if (!idea_id || !mentor_id) {
            return res.status(400).json({
                message: "idea_id and mentor_id are required"
            });
        }

        const student_id = req.user.student_id;

        // Check whether the idea exists
        const idea = await db.collection("ideas").findOne({
            _id: new ObjectId(idea_id)
        });

        if (!idea) {
            return res.status(404).json({
                message: "Idea not found"
            });
        }

        // Only the owner of the idea can request mentorship for it
        if (idea.student_id !== student_id) {
            return res.status(403).json({
                message: "You can only request guidance for your own idea"
            });
        }

        // Check whether mentor exists
        const mentor = await db.collection("mentors").findOne({
            mentor_id: parseInt(mentor_id)
        });

        if (!mentor) {
            return res.status(404).json({
                message: "Mentor not found"
            });
        }

        // Prevent duplicate pending/accepted requests
        const existingRequest = await db.collection("collaboration_requests").findOne({
            idea_id: idea_id,
            mentor_id: parseInt(mentor_id),
            student_id: student_id,
            status: { $in: ["pending", "accepted"] }
        });

        if (existingRequest) {
            return res.status(400).json({
                message: "A guidance request already exists for this mentor"
            });
        }

        const requestCount =
            await db.collection("collaboration_requests").countDocuments();

        const collaborationRequest = {
            request_id: requestCount + 1,
            idea_id: idea_id,
            student_id: student_id,
            mentor_id: parseInt(mentor_id),
            status: "pending",
            created_at: new Date()
        };

        await db.collection("collaboration_requests").insertOne(
            collaborationRequest
        );

        res.status(201).json({
            message: "Guidance request sent successfully",
            request_id: collaborationRequest.request_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to send guidance request"
        });
    }
});


// Student views guidance requests related to their ideas
app.get("/api/student/guidance-requests", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can view their guidance requests"
            });
        }

        const student_id = req.user.student_id;

        const requests = await db.collection("collaboration_requests")
            .find({
                student_id: student_id
            })
            .sort({ created_at: -1 })
            .toArray();

        res.status(200).json(requests);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch guidance requests"
        });
    }
});


// Mentor views guidance requests assigned to them
app.get("/api/mentor/guidance-requests", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "mentor") {
            return res.status(403).json({
                message: "Only mentors can view guidance requests"
            });
        }

        const mentor_id = req.user.mentor_id;

        const requests = await db.collection("collaboration_requests")
            .find({
                mentor_id: mentor_id
            })
            .sort({ created_at: -1 })
            .toArray();

        res.status(200).json(requests);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch mentor guidance requests"
        });
    }
});


// Mentor accepts a guidance request
app.put(
    "/api/collaboration-requests/:request_id/accept",
    authenticateToken,
    async (req, res) => {
        try {
            if (req.user.role !== "mentor") {
                return res.status(403).json({
                    message: "Only mentors can accept guidance requests"
                });
            }

            const request_id = parseInt(req.params.request_id);
            const mentor_id = req.user.mentor_id;

            const request = await db.collection("collaboration_requests").findOne({
                request_id: request_id
            });

            if (!request) {
                return res.status(404).json({
                    message: "Guidance request not found"
                });
            }

            // Make sure this request belongs to the logged-in mentor
            if (request.mentor_id !== mentor_id) {
                return res.status(403).json({
                    message: "You can only accept requests assigned to you"
                });
            }

            if (request.status !== "pending") {
                return res.status(400).json({
                    message: "Only pending requests can be accepted"
                });
            }

            await db.collection("collaboration_requests").updateOne(
                { request_id: request_id },
                {
                    $set: {
                        status: "accepted",
                        responded_at: new Date()
                    }
                }
            );

            res.status(200).json({
                message: "Guidance request accepted successfully"
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to accept guidance request"
            });
        }
    }
);


// Mentor rejects a guidance request
app.put(
    "/api/collaboration-requests/:request_id/reject",
    authenticateToken,
    async (req, res) => {
        try {
            if (req.user.role !== "mentor") {
                return res.status(403).json({
                    message: "Only mentors can reject guidance requests"
                });
            }

            const request_id = parseInt(req.params.request_id);
            const mentor_id = req.user.mentor_id;

            const request = await db.collection("collaboration_requests").findOne({
                request_id: request_id
            });

            if (!request) {
                return res.status(404).json({
                    message: "Guidance request not found"
                });
            }

            // Make sure this request belongs to the logged-in mentor
            if (request.mentor_id !== mentor_id) {
                return res.status(403).json({
                    message: "You can only reject requests assigned to you"
                });
            }

            if (request.status !== "pending") {
                return res.status(400).json({
                    message: "Only pending requests can be rejected"
                });
            }

            await db.collection("collaboration_requests").updateOne(
                { request_id: request_id },
                {
                    $set: {
                        status: "rejected",
                        responded_at: new Date()
                    }
                }
            );

            res.status(200).json({
                message: "Guidance request rejected successfully"
            });

        } catch (error) {
            console.error(error);

            res.status(500).json({
                message: "Failed to reject guidance request"
            });
        }
    }
);
async function startServer() {
    try {
        await client.connect();

        db = client.db("innobridge");

        console.log("MongoDB connected successfully");
        console.log("Database: innobridge");

        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

startServer();