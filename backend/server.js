const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

const PORT = 5000;
const mongoURL = "mongodb://127.0.0.1:27017";

const client = new MongoClient(mongoURL);

app.use(cors());
app.use(express.json());

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