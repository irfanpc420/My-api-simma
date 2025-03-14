const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const axios = require('axios');
const math = require('mathjs');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const mongoURI = "mongodb+srv://db_sayem:db_SAYRM-12345@cluster0.rmf2m.mongodb.net/";
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully!"))
  .catch(err => console.error("MongoDB connection error:", err));

const chatSchema = new mongoose.Schema({
  input: { type: String, unique: true, required: true },
  responses: { type: [String], default: [] }
});
const Chat = mongoose.model('Chat', chatSchema);

async function translateAPI(text, lang) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const response = await axios.get(url);
    const data = response.data;
    return data?.[0]?.[0]?.[0] || "Translation error";
  } catch (error) {
    throw new Error(`Error fetching translation: ${error.message}`);
  }
}

async function samirtranslate(text, lang = 'en') {
  if (typeof text !== "string") throw new Error("Text must be a string");
  if (typeof lang !== "string") throw new Error("Language must be a string");
  return translateAPI(text, lang);
}

function evaluateMath(expression) {
  try {
    expression = expression.replace(/[^\d+\-*/().^√]/g, '');
    expression = expression.replace(/\^/g, '**').replace(/√([^)]+)/g, 'Math.sqrt($1)');
    return math.evaluate(expression)?.toString() || null;
  } catch {
    return null;
  }
}

function toBoldMathematicalFont(text) {
  const normal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bold = '𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇123456789';
  return text.split('').map(char => (normal.includes(char) ? bold[normal.indexOf(char)] : char)).join('');
}

app.post('/teach', async (req, res) => {
  const { input, response, lang = 'en' } = req.body;
  if (!input || !response) return res.status(400).json({ error: 'Input and response are required.' });

  try {
    const normalizedInput = input.toLowerCase();
    const translatedResponse = await samirtranslate(response, lang);

    let chatEntry = await Chat.findOne({ input: normalizedInput });

    if (chatEntry) {
      if (!chatEntry.responses.includes(translatedResponse)) {
        chatEntry.responses.push(translatedResponse);
        await chatEntry.save();
        return res.json({ message: toBoldMathematicalFont(`Response added: "${response}"`) });
      } else {
        return res.json({ message: toBoldMathematicalFont(`Response already exists: "${response}"`) });
      }
    } else {
      const newEntry = new Chat({ input: normalizedInput, responses: [translatedResponse] });
      await newEntry.save();
      return res.json({ message: toBoldMathematicalFont(`Response added: "${response}"`) });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Database error while processing request.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
