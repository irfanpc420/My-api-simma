const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static('public')); // index.html লোড হবে

const DATA_FILE = './data/sim.json';

// আগের ডাটা লোড করা
function loadData() {
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// নতুন ডাটা সেভ করা
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// চ্যাটবটের উত্তর বের করা
app.get('/api/chatbot', (req, res) => {
    const userMessage = req.query.message.toLowerCase();
    const data = loadData();

    if (data[userMessage]) {
        res.json({ reply: data[userMessage].response });
    } else {
        res.json({ reply: "I don't know this yet! Try teaching me. 😊" });
    }
});

// নতুন প্রশ্ন-উত্তর শেখানো
app.post('/api/teach', (req, res) => {
    const { question, answer, response } = req.body;
    if (!question || !answer || !response) return res.json({ message: "Invalid input!" });

    const data = loadData();
    data[question.toLowerCase()] = { answer, response }; // ছোট হাতের করে সেভ
    saveData(data);

    res.json({ message: `Successfully taught: "${question}" -> "${response}"` });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
