const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const axios = require('axios');
const math = require('mathjs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const DATA_FILE = 'data.json';

// Initialize data.json if not exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
}

// Load JSON data
function loadData() {
    try {
        const rawData = fs.readFileSync(DATA_FILE);
        return JSON.parse(rawData);
    } catch (error) {
        return {};
    }
}

// Save JSON data
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Translation API
async function translateAPI(text, lang) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
    try {
        const response = await axios.get(url);
        const data = response.data;
        return data?.[0]?.[0]?.[0] || "Translation error";
    } catch (error) {
        return "Translation failed.";
    }
}

// Wrapper for translation
async function samirtranslate(text, lang = 'en') {
    try {
        return await translateAPI(text, lang);
    } catch (error) {
        return "Translation failed.";
    }
}

// Math expression evaluation
function evaluateMath(expression) {
    try {
        expression = expression.replace(/[^\d+\-*/().^√]/g, '');
        expression = expression.replace(/\^/g, '**').replace(/√([^)]+)/g, 'Math.sqrt($1)');
        return math.evaluate(expression)?.toString() || null;
    } catch {
        return null;
    }
}

// Bold Mathematical Font
function toBoldMathematicalFont(text) {
    const normal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bold = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘶𝘷𝘄𝘅𝘆𝘇123456789';
    return text.split('').map(char => (normal.includes(char) ? bold[normal.indexOf(char)] : char)).join('');
}

// Default Home Route
app.get('/public/index.html', (req, res) => {
    res.send('Welcome to the API! Everything is running smoothly.');
});

// Teach API (Store input-response in JSON)
app.post('/teach', async (req, res) => {
    const { input, response, lang = 'en' } = req.body;
    if (!input || !response) return res.status(400).json({ error: 'Input and response are required.' });

    try {
        const normalizedInput = input.toLowerCase();
        const translatedResponse = await samirtranslate(response, lang);
        let data = loadData();

        if (!data[normalizedInput]) {
            data[normalizedInput] = [];
        }

        if (!data[normalizedInput].includes(translatedResponse)) {
            data[normalizedInput].push(translatedResponse);
            saveData(data);
            return res.json({ message: toBoldMathematicalFont(`Response added: "${response}"`) });
        } else {
            return res.json({ message: toBoldMathematicalFont(`Response already exists: "${response}"`) });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Error processing request.' });
    }
});

// Handle 404 Errors
app.use((req, res) => {
    res.status(404).json({ error: "Route not found." });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
