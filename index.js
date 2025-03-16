const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const axios = require('axios');  // axios ইনস্টল করতে হবে

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB URI (এখানে সরাসরি MongoDB URI দেওয়া হয়েছে)
const MONGO_URI = "mongodb+srv://irfan:irfana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan";

// MongoDB কানেকশন সেটআপ
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);  // MongoDB কানেকশন ত্রুটি হলে সার্ভার বন্ধ করে দিবে
    });

// মডেল ডিফাইন (Question & Answer)
const TeachSchema = new mongoose.Schema({
    question: { type: String, required: true, unique: true },
    answer: { type: String, required: true }
});
const TeachModel = mongoose.model("Teach", TeachSchema);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 📌 রুট পেজ লোড করাবে (Fix: Cannot GET /)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 📌 মেসেজ অনুযায়ী উত্তর বের করা (MongoDB থেকে)
app.get('/api/chatbot', async (req, res) => {
    const message = req.query.message?.toLowerCase();
    if (!message) return res.json({ reply: "Please enter a valid message!" });

    try {
        const response = await TeachModel.findOne({ question: message });
        res.json({ reply: response ? response.answer : "I don't know the answer yet!" });
    } catch (err) {
        res.status(500).json({ reply: "Error fetching data from MongoDB!" });
    }
});

// 📌 নতুন মেসেজ-উত্তর টিচ করা (MongoDB তে সংরক্ষণ)
app.post('/api/teach', async (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) return res.json({ message: "Both question and answer are required!" });

    try {
        const newTeach = new TeachModel({ question: question.toLowerCase(), answer });
        await newTeach.save();
        res.json({ message: Successfully taught: "${question}" → "${answer}" });
    } catch (err) {
        res.status(500).json({ message: "Failed to save data to MongoDB!" });
    }
});

// 📌 Teach Command (Teach API)
app.post('/api/teachCommand', async (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) return res.status(400).json({ message: "Question and Answer are required." });

    try {
        const apiResponse = await axios.post('http://localhost:3001/api/teach', { question, answer });
        res.json(apiResponse.data);
    } catch (err) {
        res.status(500).json({ message: "An error occurred while saving teach data." });
    }
});

// 📌 সার্ভার চালানো
app.listen(PORT, () => {
    console.log(✅ Server is running on http://localhost:${PORT});
});
