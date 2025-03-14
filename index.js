const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// JSON ফাইল যেখানে টিচ করা তথ্য সংরক্ষণ হবে
const dataFile = path.join(__dirname, 'data', 'sim.json');

// 📌 রুট পেজ লোড করাবে (Fix: Cannot GET /)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 📌 মেসেজ অনুযায়ী উত্তর বের করা
app.get('/api/chatbot', (req, res) => {
    const message = req.query.message?.toLowerCase();
    if (!message) return res.json({ reply: "Please enter a valid message!" });

    fs.readFile(dataFile, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ reply: "Error reading data!" });

        let jsonData = JSON.parse(data);
        let reply = jsonData[message] || "I don't know the answer yet!";
        res.json({ reply });
    });
});

// 📌 নতুন মেসেজ-উত্তর টিচ করা
app.post('/api/teach', (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) return res.json({ message: "Both question and answer are required!" });

    fs.readFile(dataFile, 'utf8', (err, data) => {
        let jsonData = err ? {} : JSON.parse(data);
        jsonData[question.toLowerCase()] = answer;

        fs.writeFile(dataFile, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) return res.status(500).json({ message: "Failed to save data!" });
            res.json({ message: `Successfully taught: "${question}" → "${answer}"` });
        });
    });
});

// 📌 সার্ভার চালানো
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
