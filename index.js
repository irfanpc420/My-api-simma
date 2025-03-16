const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();

// MongoDB URI
const MONGO_URI = "mongodb+srv://irfan:irfana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan";

// MongoDB setup with options
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

// MongoDB Message Model
const messageSchema = new mongoose.Schema({
  message: String,
  reply: String
});

const Message = mongoose.model('Message', messageSchema);

// Load existing messages from MongoDB to sim.json
const loadMessagesToSimJson = async () => {
  try {
    const messages = await Message.find({});
    const simFilePath = path.join(__dirname, 'data/sim.json');
    const simData = {
      messages: messages.map(msg => ({ message: msg.message, reply: msg.reply }))
    };
    fs.writeFileSync(simFilePath, JSON.stringify(simData, null, 2));
    console.log('Messages loaded into sim.json');
  } catch (err) {
    console.log('Error loading messages from MongoDB to sim.json:', err);
  }
};

// Load existing data from sim.json at startup
const loadSimJson = () => {
  const simFilePath = path.join(__dirname, 'data/sim.json');
  if (fs.existsSync(simFilePath)) {
    const data = fs.readFileSync(simFilePath, 'utf8');
    return JSON.parse(data);
  } else {
    return { messages: [] };
  }
};

let simData = loadSimJson(); // Initialize simData from sim.json

// POST /teach: Save message and reply to MongoDB and sim.json
app.post('/teach', async (req, res) => {
  const { message, reply } = req.body;

  try {
    // Save to MongoDB
    const newMessage = new Message({ message, reply });
    await newMessage.save();

    // Save to sim.json
    const simFilePath = path.join(__dirname, 'data/sim.json');
    simData.messages.push({ message, reply });
    fs.writeFileSync(simFilePath, JSON.stringify(simData, null, 2));

    res.status(200).send('Message saved successfully!');
  } catch (err) {
    console.log('Error saving message:', err);  // Log error
    res.status(500).send('Error saving message!');
  }
});

// GET /reply: Fetch reply based on the message from sim.json
app.get('/reply', (req, res) => {
  const { message } = req.query;

  // Check in sim.json
  const messageData = simData.messages.find(m => m.message === message);
  if (messageData) {
    return res.json({ reply: messageData.reply });
  } else {
    return res.status(404).send('No reply found!');
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
  // Load messages from MongoDB into sim.json at startup
  loadMessagesToSimJson();
});
