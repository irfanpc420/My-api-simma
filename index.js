const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize express app
const app = express();
const port = 10000;

// Middleware
app.use(bodyParser.json());

// MongoDB connection string
const mongoURI = 'mongodb+srv://botreplitfb:<db_password>@cluster0.j4x32.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Connect to MongoDB
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((err) => {
    console.error('MongoDB Connection Error: ', err.message);
  });

// Default route to check server is working
app.get('/', (req, res) => {
  res.send('API is working!');
});

// API to teach a message
app.post('/teach', async (req, res) => {
  const { input, reply } = req.body;

  if (!input || !reply) {
    return res.status(400).send({ error: "Input and reply are required" });
  }

  try {
    // Assume a collection named 'messages' exists
    const Message = mongoose.model('Message', new mongoose.Schema({
      input: { type: String, required: true },
      reply: { type: String, required: true }
    }));

    const existingMessage = await Message.findOne({ input: input.toLowerCase() });

    if (existingMessage) {
      return res.status(400).send({ error: 'Message already exists!' });
    }

    const newMessage = new Message({
      input: input.toLowerCase(),
      reply: reply
    });

    await newMessage.save();
    res.status(201).send({ message: 'Message taught successfully!' });
  } catch (err) {
    console.error('Error while teaching message:', err);
    res.status(500).send({ error: 'Something went wrong while saving message!' });
  }
});

// API to delete a message
app.delete('/delete', async (req, res) => {
  const { input } = req.body;

  if (!input) {
    return res.status(400).send({ error: 'Input is required to delete' });
  }

  try {
    const result = await mongoose.model('Message').deleteOne({ input: input.toLowerCase() });

    if (result.deletedCount === 0) {
      return res.status(404).send({ error: 'Message not found to delete!' });
    }

    res.status(200).send({ message: 'Message deleted successfully!' });
  } catch (err) {
    console.error('Error while deleting message:', err);
    res.status(500).send({ error: 'Something went wrong while deleting message!' });
  }
});

// API to check if a message is taught
app.get('/check', async (req, res) => {
  const { input } = req.query;

  if (!input) {
    return res.status(400).send({ error: 'Input is required to check' });
  }

  try {
    const message = await mongoose.model('Message').findOne({ input: input.toLowerCase() });

    if (!message) {
      return res.status(404).send({ error: 'Message not found!' });
    }

    res.status(200).send({ reply: message.reply });
  } catch (err) {
    console.error('Error while checking message:', err);
    res.status(500).send({ error: 'Something went wrong while checking message!' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
