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