const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3001;

app.use(express.json());

// Data file
const DATA_FILE = './data/sim.json';

// Load data
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Save data
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API: মেসেজ অনুযায়ী উত্তর বের করা
app.get('/api/chatbot', (req, res) => {
    const userMessage = req.query.message.toLowerCase();
    const data = loadData();

    if (data[userMessage]) {
        res.json({ reply: data[userMessage] });
    } else {
        res.json({ reply: "I don't know this yet! Try teaching me. 😊" });
    }
});

// API: নতুন প্রশ্ন-উত্তর শেখানো
app.post('/api/teach', (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) return res.json({ message: "Invalid input!" });

    const data = loadData();
    data[question.toLowerCase()] = answer;
    saveData(data);

    res.json({ message: `Successfully taught: "${question}" -> "${answer}"` });
});

// API: টিচ করা ডাটা মুছে ফেলা
app.post('/api/delete', (req, res) => {
    const { question } = req.body;
    if (!question) return res.json({ message: "Please provide a question to delete!" });

    const data = loadData();
    if (data[question.toLowerCase()]) {
        delete data[question.toLowerCase()];
        saveData(data);
        res.json({ message: `Deleted: "${question}" from database.` });
    } else {
        res.json({ message: `No entry found for "${question}".` });
    }
});

// Messenger Bot Commands ফাইল লোড করা (irfan.js)
const irfanCommand = require('./commands/irfan');

// Messenger Bot-এর জন্য API
app.post('/api/messenger', (req, res) => {
    const { sender, message } = req.body;
    if (!message) return res.json({ reply: "Invalid message!" });

    let reply = irfanCommand.handleMessage(message);
    res.json({ reply });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
