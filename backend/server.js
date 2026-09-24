require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
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