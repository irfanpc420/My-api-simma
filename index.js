const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// 📌 MongoDB সংযোগ
const MONGO_URI = "mongodb+srv://irfan:irfana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan"; // 👉 নিজের URI ব্যবহার করো
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ Connected to MongoDB!"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 📌 Schema & Model তৈরি করা
const messageSchema = new mongoose.Schema({
    question: { type: String, required: true, unique: true },
    answer: { type: String, required: true }
});
const Message = mongoose.model('Message', messageSchema);

// 📌 Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 📌 রুট পেজ লোড করাবে
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 📌 মেসেজ অনুযায়ী উত্তর বের করা
app.get('/api/chatbot', async (req, res) => {
    const message = req.query.message?.toLowerCase();
    if (!message) return res.json({ reply: "Please enter a valid message!" });

    try {
        const data = await Message.findOne({ question: message });
        res.json({ reply: data ? data.answer : "I don't know the answer yet!" });
    } catch (err) {
        res.status(500).json({ reply: "Error fetching data from MongoDB!" });
    }
});

// 📌 নতুন মেসেজ-উত্তর টিচ করা (MongoDB তে সংরক্ষণ করা)
app.post('/api/teach', async (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) return res.json({ message: "Both question and answer are required!" });

    try {
        await Message.findOneAndUpdate(
            { question: question.toLowerCase() },
            { answer: answer },
            { upsert: true, new: true }
        );
        res.json({ message: Successfully taught: "${question}" → "${answer}" });
    } catch (err) {
        res.status(500).json({ message: "Failed to save data in MongoDB!" });
    }
});

// 📌 Teach Command (Teach API)
app.post('/api/teachCommand', async (req, res) => {
    const { question, answer } = req.body;

    if (!question || !answer) return res.status(400).json({ message: "Question and Answer are required." });

    try {
        // API কল করে ডেটা সেভ করা
        const apiResponse = await axios.post('http://localhost:3001/api/teach', {
            question: question,
            answer: answer
        });

        if (apiResponse.data) {
            res.status(200).json({ message: Successfully taught: "${question}" → "${answer}" });
        } else {
            res.status(500).json({ message: "Failed to save teach data." });
        }
    } catch (err) {
        res.status(500).json({ message: "An error occurred while saving teach data." });
    }
});

// 📌 সার্ভার চালানো
app.listen(PORT, () => {
    console.log(✅ Server is running on http://localhost:${PORT});
});
