const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const bodyParser = require('body-parser');

// MongoDB Schema
const messageSchema = new mongoose.Schema({
  message: String,
  reply: String,
});

const Message = mongoose.model('Message', messageSchema);

const app = express();
app.use(bodyParser.json());

const simFilePath = 'data/sim.json'; // Path to local file

// MongoDB connection
const MONGO_URI = "mongodb+srv://irfan:irfana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
  loadMessagesToSimJson(); // Load data on startup from MongoDB to sim.json
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Load messages from MongoDB to sim.json on startup
const loadMessagesToSimJson = async () => {
  try {
    // Fetch all messages from MongoDB
    const messages = await Message.find();

    // Read the existing sim.json file
    fs.readFile(simFilePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading sim.json:', err);
        return;
      }

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

      // Add MongoDB messages to sim.json if they are not already present
      messages.forEach((messageData) => {
        const existingMessage = jsonData.messages.find(m => m.message === messageData.message);
        if (!existingMessage) {
          jsonData.messages.push({ message: messageData.message, reply: messageData.reply });
        }
      });

      // Write back to sim.json
      fs.writeFile(simFilePath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
          console.error('Error saving to sim.json:', err);
        } else {
          console.log('MongoDB messages loaded into sim.json');
        }
      });
    });
  } catch (err) {
    console.error('Error loading messages from MongoDB:', err);
  }
};

// POST /teach: Save message and reply to MongoDB and sim.json
app.post('/teach', async (req, res) => {
  const { message, reply } = req.body;

  try {
    // Save to MongoDB
    const newMessage = new Message({ message, reply });
    await newMessage.save();

    // Save to sim.json
    fs.readFile(simFilePath, 'utf8', (err, data) => {
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

      fs.writeFile(simFilePath, JSON.stringify(jsonData, null, 2), (err) => {
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

// POST /reply: Get a reply from sim.json
app.post('/reply', (req, res) => {
  const { message } = req.body;

  fs.readFile(simFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('Error reading sim.json');

    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (parseErr) {
      console.error('Error parsing sim.json:', parseErr);
      return res.status(500).send('Error parsing sim.json');
    }

    // Ensure messages array exists
    if (!jsonData.messages) {
      return res.status(404).send('No messages found');
    }

    const foundMessage = jsonData.messages.find(m => m.message === message);
    if (foundMessage) {
      return res.status(200).send({ reply: foundMessage.reply });
    } else {
      return res.status(404).send('Message not found');
    }
  });
});

// Start the server
const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
