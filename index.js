const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 10000;

// MongoDB Schema
const messageSchema = new mongoose.Schema({
  message: String,
  reply: String,
});

const Message = mongoose.model('Message', messageSchema);

// Public folder for serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser Middleware
app.use(bodyParser.json());

// MongoDB connection
const mongoUri = 'mongodb+srv://irfan:irfana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
  loadMessagesToSimJson(); // Load data on startup from MongoDB to sim.json
});

// Load messages from MongoDB to sim.json on startup
async function loadMessagesToSimJson() {
  try {
    const messages = await Message.find({});
    // Read the current sim.json file
    fs.readFile('data/sim.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading sim.json:', err);
        return;
      }

      let jsonData = JSON.parse(data);
      if (!jsonData.messages) {
        jsonData.messages = [];
      }

      // Add messages from MongoDB to sim.json if not already present
      messages.forEach((msg) => {
        const existingMessage = jsonData.messages.find(m => m.message === msg.message);
        if (!existingMessage) {
          jsonData.messages.push({ message: msg.message, reply: msg.reply });
        }
      });

      // Save the updated sim.json file
      fs.writeFile('data/sim.json', JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error('Error saving to sim.json:', err);
        } else {
          console.log('Messages loaded from MongoDB to sim.json');
        }
      });
    });
  } catch (err) {
    console.error('Error loading messages from MongoDB:', err);
  }
}

// API to teach the bot a new message and reply
app.post('/teach', async (req, res) => {
  const { message, reply } = req.body;

  try {
    // Save to MongoDB
    const newMessage = new Message({ message, reply });
    await newMessage.save();

    // Save to sim.json (Same as before)
    fs.readFile('data/sim.json', 'utf8', (err, data) => {
      if (err) return res.status(500).send('Error reading sim.json');

      let jsonData;
      try {
        jsonData = JSON.parse(data);
      } catch (parseErr) {
        console.error('Error parsing sim.json:', parseErr);
        jsonData = {}; // Start with an empty object if parsing fails
      }

      // Ensure messages array exists
      if (!jsonData.messages) {
        jsonData.messages = [];
      }

      // Avoid duplicates before adding
      const existingMessage = jsonData.messages.find(m => m.message === message);
      if (!existingMessage) {
        jsonData.messages.push({ message, reply });
      }

      fs.writeFile('data/sim.json', JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error('Error saving to sim.json:', err);
        } else {
          console.log('Message and reply saved to sim.json');
        }
      });
    });

    res.status(200).send('Message and reply saved');
  } catch (err) {
    console.error('Error saving to MongoDB or sim.json:', err);
    res.status(500).send('Error saving message and reply');
  }
});

// API to get a reply from sim.json (No MongoDB call)
app.post('/reply', (req, res) => {
  const { message } = req.body;

  fs.readFile('data/sim.json', 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading sim.json');

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing sim.json:', parseErr);
      return res.status(500).send('Error parsing sim.json');
    }

    if (!jsonData.messages) {
      return res.status(404).send('No messages found');
    }

    // Find message by partial match (using regex)
    const foundMessage = jsonData.messages.find(m => message.toLowerCase().includes(m.message.toLowerCase()));
    if (foundMessage) {
      return res.status(200).send({ reply: foundMessage.reply });
    } else {
      return res.status(404).send('Message not found');
    }
  });
});

// Default route for '/' to serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
