const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3001;

app.use(express.json());

// JSON Data File
const DATA_FILE = './data/sim.json';

// Load Data from JSON
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Save Data to JSON
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ✅ API: মেসেজ অনুযায়ী উত্তর বের করা
app.get('/api/chatbot', (req, res) => {
    const userMessage = req.query.message?.toLowerCase();
    if (!userMessage) return res.json({ reply: "Please provide a message!" });

    const data = loadData();
    const reply = data[userMessage] || "I don't know this yet! Try teaching me.";

    res.json({ reply });
});

// ✅ API: নতুন প্রশ্ন-উত্তর শেখানো (Teach Bot)
app.post('/api/teach', (req, res) => {
    const { question, answer } = req.body;
    if (!question || !answer) return res.json({ message: "Invalid input! Provide question and answer." });

    const data = loadData();
    data[question.toLowerCase()] = answer;
    saveData(data);

    res.json({ message: `Successfully taught: "${question}" -> "${answer}"` });
});

// ✅ API: টিচ করা ডাটা মুছে ফেলা (Delete Taught Data)
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

// ✅ Server Start
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
