const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 5000;

const mongoURL = "mongodb://127.0.0.1:27017";
const client = new MongoClient(mongoURL);

let db;
// JWT authentication middleware
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
require("dotenv").config();
async function startServer() {
    try {
        await client.connect();

        db = client.db("innobridge");

        console.log("MongoDB connected successfully");

        app.get("/", (req, res) => {
            res.send("InnoBridge Backend is running!");
        });

        // Create a new idea
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

        // validation goes HERE
                if (
            !title ||
            !description ||
            !category ||
            !requiredSkills ||
            !technologyStack ||
            !problemStatement ||
            !expectedOutcome
        ) {
            return res.status(400).json({
                message: "All required fields must be provided"
            });
        }

        const result = await db.collection("ideas").insertOne(idea);

        res.status(201).json({
            message: "Idea created successfully",
            ideaId: result.insertedId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to create idea"
        });
    }
});
        // Create a new student
        // Register a new student
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

        // Check whether email already exists
        const existingStudent = await db.collection("students")
            .findOne({ email: email });

        if (existingStudent) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash password
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

        // Student login
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find student by email
        const student = await db.collection("students").findOne({
            email: email
        });

        if (!student) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            student.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Create JWT token
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

// Mentor Login
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
        // Create a new mentor
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

        // Create a collaboration request
app.post("/api/collaboration-requests", authenticateToken, async (req, res) => {
    try {

        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can send guidance requests"
            });
        }

        const {
            idea_id,
            mentor_id,
            request_message
        } = req.body || {};

        const student_id = req.user.student_id;
        const mentor = await db.collection("mentors").findOne({
    mentor_id: parseInt(mentor_id)
});

if (!mentor) {
    return res.status(404).json({
        message: "Mentor not found"
    });
}

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
        message: "You can only send guidance requests for your own idea"
    });
}

const existingRequest = await db.collection("collaboration_requests").findOne({
    idea_id: idea_id,
    student_id: student_id,
    mentor_id: parseInt(mentor_id),
    request_status: "Pending"
});

if (existingRequest) {
    return res.status(400).json({
        message: "A guidance request is already pending"
    });
}

        // Keep the rest of your existing code below this point

        const lastRequest = await db.collection("collaboration_requests")
    .find({})
    .sort({ request_id: -1 })
    .limit(1)
    .toArray();

const nextRequestId =
    lastRequest.length > 0 ? lastRequest[0].request_id + 1 : 1;

const collaborationRequest = {
    request_id: nextRequestId,
    idea_id,
    student_id,
    mentor_id: parseInt(mentor_id),
    request_message,
    request_status: "Pending",
    request_date: new Date()
};

        await db.collection("collaboration_requests")
            .insertOne(collaborationRequest);

        res.status(201).json({
            message: "Guidance request sent successfully",
            request_id: collaborationRequest.request_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create guidance request"
        });
    }
});

        // Create a new team
app.post("/api/teams", authenticateToken, async (req, res) => {
    try {
        // Only students can create teams
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

        // Check whether the idea exists
        const idea = await db.collection("ideas").findOne({
            _id: new ObjectId(idea_id)
        });

        if (!idea) {
            return res.status(404).json({
                message: "Idea not found"
            });
        }

        // Check whether the logged-in student owns the idea
        if (idea.student_id !== student_id) {
            return res.status(403).json({
                message: "You can only create a team for your own idea"
            });
        }

        // Create team ID
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

        // Add a student to a team
app.post("/api/team-members", authenticateToken, async (req, res) => {
    try {
        // Only students can add team members
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

        // Check whether the team exists
        const team = await db.collection("teams").findOne({
            team_id: parseInt(team_id)
        });

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        // Find the idea associated with this team
        const idea = await db.collection("ideas").findOne({
            _id: new ObjectId(team.idea_id)
        });

        if (!idea) {
            return res.status(404).json({
                message: "Associated idea not found"
            });
        }

        // Only the owner of the idea can add members
        if (idea.student_id !== loggedInStudentId) {
            return res.status(403).json({
                message: "Only the idea owner can add team members"
            });
        }

        // Check whether the student is already a member
        const existingMember = await db.collection("team_members").findOne({
            team_id: parseInt(team_id),
            student_id: parseInt(student_id)
        });

        if (existingMember) {
            return res.status(400).json({
                message: "Student is already a team member"
            });
        }

        // Create member ID
        const lastMember = await db.collection("team_members")
    .find({})
    .sort({ member_id: -1 })
    .limit(1)
    .toArray();

const nextMemberId =
    lastMember.length > 0 ? lastMember[0].member_id + 1 : 1;

const teamMember = {
    member_id: nextMemberId,
            team_id: parseInt(team_id),
            student_id: parseInt(student_id),
            joined_at: new Date()
        };

        await db.collection("team_members").insertOne(teamMember);

        res.status(201).json({
            message: "Team member added successfully",
            member_id: teamMember.member_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to add team member"
        });
    }
});

        // Create a progress record
app.post("/api/progress", authenticateToken, async (req, res) => {
    try {
        // Only students can submit progress
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can submit progress"
            });
        }

        const {
            team_id,
            progress_description,
            progress_percentage
        } = req.body;
        if (progress_percentage < 0 || progress_percentage > 100) {
    return res.status(400).json({
        message: "Progress percentage must be between 0 and 100"
    });
}

        const student_id = req.user.student_id;

        // Check whether the team exists
        const team = await db.collection("teams").findOne({
            team_id: parseInt(team_id)
        });

        if (!team) {
            return res.status(404).json({
                message: "Team not found"
            });
        }

        // Check whether the logged-in student is a member of the team
        const teamMember = await db.collection("team_members").findOne({
            team_id: parseInt(team_id),
            student_id: student_id
        });

        if (!teamMember) {
            return res.status(403).json({
                message: "You are not a member of this team"
            });
        }

        // Create progress ID
        const lastProgress = await db.collection("progress")
    .find({})
    .sort({ progress_id: -1 })
    .limit(1)
    .toArray();

const nextProgressId =
    lastProgress.length > 0 ? lastProgress[0].progress_id + 1 : 1;

const progress = {
    progress_id: nextProgressId,
            team_id: parseInt(team_id),
            student_id: student_id,
            progress_description: progress_description,
            progress_percentage: progress_percentage,
            progress_date: new Date()
        };

        await db.collection("progress").insertOne(progress);

        res.status(201).json({
            message: "Progress submitted successfully",
            progress_id: progress.progress_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to submit progress"
        });
    }
});

        // Create feedback
app.post("/api/feedback", authenticateToken, async (req, res) => {
    try {
        // Only mentors can provide feedback
        if (req.user.role !== "mentor") {
            return res.status(403).json({
                message: "Only mentors can provide feedback"
            });
        }

        const {
            team_id,
            comments,
            suggestions,
            rating
        } = req.body;
        if (rating < 1 || rating > 5) {
    return res.status(400).json({
        message: "Rating must be between 1 and 5"
    });
}

        // Get mentor ID from JWT
        const mentor_id = req.user.mentor_id;

        // Create feedback ID
        const lastFeedback = await db.collection("feedback")
    .find({})
    .sort({ feedback_id: -1 })
    .limit(1)
    .toArray();

const nextFeedbackId =
    lastFeedback.length > 0 ? lastFeedback[0].feedback_id + 1 : 1;

const feedback = {
    feedback_id: nextFeedbackId,
            mentor_id: mentor_id,
            team_id: team_id,
            comments: comments,
            suggestions: suggestions,
            rating: rating,
            feedback_date: new Date()
        };

        // Save feedback
        await db.collection("feedback").insertOne(feedback);


        // ----------------------------------------
        // CREATE NOTIFICATION FOR TEAM STUDENTS
        // ----------------------------------------

        const teamMembers = await db.collection("team_members")
            .find({
                team_id: team_id
            })
            .toArray();

        const lastNotification = await db.collection("notifications")
    .find({})
    .sort({ notification_id: -1 })
    .limit(1)
    .toArray();

let nextNotificationId =
    lastNotification.length > 0
        ? lastNotification[0].notification_id + 1
        : 1;

        for (const member of teamMembers) {

            const notification = {
                notification_id: nextNotificationId,
                student_id: member.student_id,
                mentor_id: mentor_id,
                title: "New Feedback Received",
                message: "Your mentor has provided feedback on your project.",
                notification_type: "feedback",
                is_read: false,
                created_at: new Date()
            };

            await db.collection("notifications")
                .insertOne(notification);

            nextNotificationId++;
        }


        // ----------------------------------------
        // RESPONSE
        // ----------------------------------------

        res.status(201).json({
            message: "Feedback created successfully",
            feedback_id: feedback.feedback_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to create feedback"
        });
    }
});
        // Create a notification
app.post("/api/notifications", authenticateToken, async (req, res) => {
    try {
        const {
            student_id,
            mentor_id,
            title,
            message,
            notification_type
        } = req.body;

        const lastNotification = await db.collection("notifications")
    .find({})
    .sort({ notification_id: -1 })
    .limit(1)
    .toArray();

const nextNotificationId =
    lastNotification.length > 0
        ? lastNotification[0].notification_id + 1
        : 1;

const notification = {
    notification_id: nextNotificationId,
    student_id,
    mentor_id,
    title,
    message,
    notification_type,
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

        // Create privacy settings for an idea
app.post("/api/privacy-settings", authenticateToken, async (req, res) => {
    try {
        // Only students can manage privacy settings
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can manage privacy settings"
            });
        }

        const {
            idea_id,
            visibility
        } = req.body;

        if (!ObjectId.isValid(idea_id)) {
    return res.status(400).json({
        message: "Invalid idea ID"
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

        // Only the owner can change privacy settings
        if (idea.student_id !== student_id) {
            return res.status(403).json({
                message: "You can only change privacy settings for your own idea"
            });
        }

        // Check whether privacy settings already exist
        const existingSettings = await db.collection("privacy_settings")
            .findOne({
                idea_id: idea_id
            });

        if (existingSettings) {
            // Update existing settings
            await db.collection("privacy_settings").updateOne(
                {
                    idea_id: idea_id
                },
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

        // Create new privacy settings
        const lastPrivacySetting = await db.collection("privacy_settings")
    .find({})
    .sort({ privacy_id: -1 })
    .limit(1)
    .toArray();

const nextPrivacyId =
    lastPrivacySetting.length > 0
        ? lastPrivacySetting[0].privacy_id + 1
        : 1;

const privacySettings = {
    privacy_id: nextPrivacyId,
            idea_id: idea_id,
            student_id: student_id,
            visibility: visibility,
            created_at: new Date()
        };

        await db.collection("privacy_settings")
            .insertOne(privacySettings);

        res.status(201).json({
            message: "Privacy settings created successfully",
            privacy_id: privacySettings.privacy_id
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to manage privacy settings"
        });
    }
});
app.post("/api/mentor/guidance-requests/:request_id/accept", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "mentor") {
            return res.status(403).json({
                message: "Only mentors can accept guidance requests"
            });
        }

        const mentor_id = req.user.mentor_id;
        const request_id = parseInt(req.params.request_id);

        // First find the request using only request_id
        const request = await db.collection("collaboration_requests")
            .findOne({
                request_id: request_id
            });

        if (!request) {
            return res.status(404).json({
                message: "Guidance request not found"
            });
        }

        // Check whether the request belongs to the logged-in mentor
        if (request.mentor_id !== mentor_id) {
            return res.status(403).json({
                message: "You can only accept requests sent to you"
            });
        }
        if (request.request_status !== "Pending") {
    return res.status(400).json({
        message: "This guidance request has already been processed"
    });
}

        // Accept the request
        await db.collection("collaboration_requests").updateOne(
            {
                request_id: request_id
            },
            {
                $set: {
                    request_status: "Accepted"
                }
            }
        );

        // Create notification for the student
        const lastNotification = await db.collection("notifications")
    .find({})
    .sort({ notification_id: -1 })
    .limit(1)
    .toArray();

const nextNotificationId =
    lastNotification.length > 0
        ? lastNotification[0].notification_id + 1
        : 1;

const notification = {
    notification_id: nextNotificationId,
            student_id: request.student_id,
            mentor_id: mentor_id,
            title: "Guidance Request Accepted",
            message: "Your guidance request has been accepted by the mentor.",
            notification_type: "guidance_request",
            is_read: false,
            created_at: new Date()
        };

        await db.collection("notifications")
            .insertOne(notification);

        res.status(200).json({
            message: "Guidance request accepted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to accept guidance request"
        });
    }
});
app.post("/api/mentor/guidance-requests/:request_id/reject", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "mentor") {
            return res.status(403).json({
                message: "Only mentors can reject guidance requests"
            });
        }

        const mentor_id = req.user.mentor_id;
        const request_id = parseInt(req.params.request_id);

        // First find the request using request_id
        const request = await db.collection("collaboration_requests")
            .findOne({
                request_id: request_id
            });

        if (!request) {
            return res.status(404).json({
                message: "Guidance request not found"
            });
        }

        // Check request ownership
        if (request.mentor_id !== mentor_id) {
            return res.status(403).json({
                message: "You can only reject requests sent to you"
            });
        }

        // Reject the request
        await db.collection("collaboration_requests").updateOne(
            {
                request_id: request_id
            },
            {
                $set: {
                    request_status: "Rejected"
                }
            }
        );

        // Create notification for the student
        const lastNotification = await db.collection("notifications")
    .find({})
    .sort({ notification_id: -1 })
    .limit(1)
    .toArray();

const nextNotificationId =
    lastNotification.length > 0
        ? lastNotification[0].notification_id + 1
        : 1;

const notification = {
    notification_id: nextNotificationId,
    student_id: request.student_id,
    mentor_id: mentor_id,
    title: "Guidance Request Accepted",
    message: "Your guidance request has been accepted by the mentor.",
    notification_type: "guidance_request",
    is_read: false,
    created_at: new Date()
};

        await db.collection("notifications")
            .insertOne(notification);

        res.status(200).json({
            message: "Guidance request rejected successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to reject guidance request"
        });
    }
});

        // Get all students
app.get("/api/students", authenticateToken, async (req, res) => {
    try {
        const students = await db.collection("students").find(
            {},
            {
                projection: {
                    password: 0
                }
            }
        ).toArray();

        res.status(200).json(students);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch students"
        });
    }
});

// Students can manage their own ideas, including ideas hidden from public discovery.
app.get("/api/student/ideas", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can view their ideas" });
        }

        const ideas = await db.collection("ideas")
            .find({ student_id: req.user.student_id })
            .toArray();
        const settings = await db.collection("privacy_settings")
            .find({ student_id: req.user.student_id })
            .toArray();
        const visibilityByIdea = new Map(settings.map((setting) => [setting.idea_id, setting.visibility]));

        res.status(200).json(ideas.map((idea) => ({
            ...idea,
            visibility: visibilityByIdea.get(idea._id.toString()) || "public"
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch your ideas" });
    }
});

// Get all ideas
app.get("/api/ideas", async (req, res) => {
    try {
        const ideas = await db.collection("ideas")
            .find({})
            .toArray();

        const visibleIdeas = [];

        for (const idea of ideas) {

            const privacySettings =
                await db.collection("privacy_settings").findOne({
                    idea_id: idea._id.toString()
                });

            // If no privacy setting exists, keep the idea visible
            if (!privacySettings) {
                visibleIdeas.push(idea);
                continue;
            }

            // Only public ideas are visible
            if (privacySettings.visibility.toLowerCase() === "public")  {
                visibleIdeas.push(idea);
            }
        }

        res.status(200).json(visibleIdeas);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch ideas"
        });
    }
});
        // Get all mentors
app.get("/api/mentors", authenticateToken, async (req, res) => {
    try {
        const mentors = await db.collection("mentors").find(
            {},
            {
                projection: {
                    password: 0
                }
            }
        ).toArray();

        res.status(200).json(mentors);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch mentors"
        });
    }
});

// Get all collaboration requests
app.get("/api/mentor/guidance-requests", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "mentor") {
            return res.status(403).json({
                message: "Only mentors can view guidance requests"
            });
        }

        const mentor_id = req.user.mentor_id;

        const requests = await db.collection("collaboration_requests")
            .find({ mentor_id: mentor_id })
            .toArray();

        res.status(200).json(requests);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch guidance requests"
        });
    }
});
        // Get all teams
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

        // Get all team members
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

app.get("/api/teams/:team_id/members", authenticateToken, async (req, res) => {
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

        const teamMembers = await db.collection("team_members")
            .find({ team_id: team_id })
            .toArray();

        res.status(200).json(teamMembers);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch team members"
        });
    }
});

        // Get all progress records
app.get("/api/progress", authenticateToken, async (req, res) => {
    try {
        const progress = await db.collection("progress")
            .find({})
            .toArray();

        res.status(200).json(progress);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch progress"
        });
    }
});

        // Get all feedback
app.get("/api/feedback", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "mentor") {
            return res.status(403).json({
                message: "Only mentors can view feedback"
            });
        }

        const mentor_id = req.user.mentor_id;

        const feedback = await db.collection("feedback")
            .find({
                mentor_id: mentor_id
            })
            .toArray();

        res.status(200).json(feedback);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch feedback"
        });
    }
});

app.get("/api/student/feedback", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can view team feedback"
            });
        }

        const student_id = req.user.student_id;

        // Find teams where the logged-in student is a member
        const teamMemberships = await db.collection("team_members")
            .find({
                student_id: student_id
            })
            .toArray();

        const teamIds = teamMemberships.map(member => member.team_id);

        // Find feedback for those teams
        const feedback = await db.collection("feedback")
            .find({
                team_id: { $in: teamIds }
            })
            .toArray();

        res.status(200).json(feedback);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch student feedback"
        });
    }
});

        // Get all notifications
app.get("/api/notifications", authenticateToken, async (req, res) => {
    try {
        if (req.user.role === "student") {

            const notifications = await db.collection("notifications")
                .find({
                    student_id: req.user.student_id
                })
                .toArray();

            return res.status(200).json(notifications);
        }

        if (req.user.role === "mentor") {

            const notifications = await db.collection("notifications")
                .find({
                    mentor_id: req.user.mentor_id
                })
                .toArray();

            return res.status(200).json(notifications);
        }

        return res.status(403).json({
            message: "Invalid user role"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch notifications"
        });
    }
});

app.put("/api/notifications/:notification_id/read", authenticateToken, async (req, res) => {
    try {
        const notification_id = parseInt(req.params.notification_id);

        const notification = await db.collection("notifications").findOne({
            notification_id: notification_id
        });

        if (!notification) {
            return res.status(404).json({
                message: "Notification not found"
            });
        }

        // Check that the notification belongs to the logged-in user
        if (req.user.role === "student") {
            if (notification.student_id !== req.user.student_id) {
                return res.status(403).json({
                    message: "You can only update your own notifications"
                });
            }
        } else if (req.user.role === "mentor") {
            if (notification.mentor_id !== req.user.mentor_id) {
                return res.status(403).json({
                    message: "You can only update your own notifications"
                });
            }
        } else {
            return res.status(403).json({
                message: "Invalid user role"
            });
        }

        await db.collection("notifications").updateOne(
            { notification_id: notification_id },
            {
                $set: {
                    is_read: true
                }
            }
        );

        res.status(200).json({
            message: "Notification marked as read"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to mark notification as read"
        });
    }
});
app.put("/api/notifications/read-all", authenticateToken, async (req, res) => {
    try {
        let filter = {};

        if (req.user.role === "student") {
            filter = { student_id: req.user.student_id };
        } else if (req.user.role === "mentor") {
            filter = { mentor_id: req.user.mentor_id };
        } else {
            return res.status(403).json({
                message: "Invalid user role"
            });
        }

        await db.collection("notifications").updateMany(
            filter,
            {
                $set: {
                    is_read: true
                }
            }
        );

        res.status(200).json({
            message: "All notifications marked as read"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to mark all notifications as read"
        });
    }
});

        // Get all privacy settings
app.get("/api/privacy-settings", authenticateToken, async (req, res) => {
    try {
        const privacySettings = await db.collection("privacy_settings")
            .find({})
            .toArray();

        res.status(200).json(privacySettings);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch privacy settings"
        });
    }
});
app.get("/api/teams/:team_id/progress", authenticateToken, async (req, res) => {
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
            .sort({ progress_date: -1 })
            .toArray();

        res.status(200).json(progress);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch team progress"
        });
    }
});

app.get("/api/student/guidance-requests", authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== "student") {
            return res.status(403).json({
                message: "Only students can view their guidance requests"
            });
        }

        const student_id = req.user.student_id;

        const requests = await db.collection("collaboration_requests")
            .find({ student_id: student_id })
            .toArray();

        res.status(200).json(requests);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch guidance requests"
        });
    }
});

// =========================================================
// ML RECOMMENDATION API ROUTES
// =========================================================

const ML_API_URL = "http://127.0.0.1:8000";

// Student -> Student recommendations
app.get("/api/recommendations/students/:studentId", authenticateToken, async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        const response = await axios.get(
            `${ML_API_URL}/api/recommendations/students/${studentId}`
        );

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Student recommendation error:", error.message);

        res.status(500).json({
            message: "Failed to fetch student recommendations"
        });
    }
});


// Student -> Mentor recommendations
app.get("/api/recommendations/mentors/:studentId", authenticateToken, async (req, res) => {
    try {
        const studentId = Number(req.params.studentId);

        const response = await axios.get(
            `${ML_API_URL}/api/recommendations/mentors/${studentId}`
        );

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Mentor recommendation error:", error.message);

        res.status(500).json({
            message: "Failed to fetch mentor recommendations"
        });
    }
});


// Idea -> Student recommendations
app.get("/api/recommendations/ideas/:ideaId/students", authenticateToken, async (req, res) => {
    try {
        const ideaId = req.params.ideaId;

        const response = await axios.get(
            `${ML_API_URL}/api/recommendations/ideas/${ideaId}/students`
        );

        res.status(200).json(response.data);

    } catch (error) {
        console.error("Idea recommendation error:", error.message);

        res.status(500).json({
            message: "Failed to fetch student recommendations for idea"
        });
    }
});
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("MongoDB connection failed:", error);
    }
}

startServer();