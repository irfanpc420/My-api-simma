const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit'); // Rate limiting প্যাকেজ

const app = express();

// MongoDB URI
const MONGO_URI = "mongodb+srv://irfan:irfana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan";

// MongoDB setup with updated options
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware to parse JSON
app.use(bodyParser.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting middleware to avoid too many requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 মিনিট
  max: 100, // প্রতি 15 মিনিটে 100 রিকোয়েস্ট অনুমোদিত
  message: 'Too many requests, please try again later.'
});

app.use(limiter);

// MongoDB Message Model
const messageSchema = new mongoose.Schema({
  message: String,
  reply: String
});

const Message = mongoose.model('Message', messageSchema);

// POST /teach: Save message and reply to MongoDB and sim.json
app.post('/teach', async (req, res) => {
  const { message, reply } = req.body;

  try {
    // Save to MongoDB
    const newMessage = new Message({ message, reply });
    await newMessage.save();

    // Save to sim.json
    const simFilePath = path.join(__dirname, 'data/sim.json');
    fs.readFile(simFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Error reading sim.json');

      let jsonData = JSON.parse(data);
      jsonData.messages.push({ message, reply });

      fs.writeFile(simFilePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) return res.status(500).send('Error saving to sim.json');
        res.status(200).send('Message saved successfully!');
      });
    });
  } catch (err) {
    res.status(500).send('Error saving message!');
  }
});

// GET /reply: Fetch reply based on the message from MongoDB or sim.json
app.get('/reply', async (req, res) => {
  const { message } = req.query;

  try {
    // Check in MongoDB
    const replyData = await Message.findOne({ message });
    if (replyData) return res.json({ reply: replyData.reply });

    // If not found in MongoDB, check sim.json
    const simFilePath = path.join(__dirname, 'data/sim.json');
    fs.readFile(simFilePath, 'utf8', (err, data) => {
      if (err) return res.status(500).send('Error reading sim.json');

      let jsonData = JSON.parse(data);
      const messageData = jsonData.messages.find(m => m.message === message);
      if (messageData) {
        return res.json({ reply: messageData.reply });
      } else {
        return res.status(404).send('No reply found!');
      }
    });
  } catch (err) {
    res.status(500).send('Error fetching reply!');
  }
});

// Root route to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Server setup
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
