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

async function startServer() {
    try {
        await client.connect();

        const db = client.db("innobridge");

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