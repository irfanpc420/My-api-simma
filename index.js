const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// MongoDB URI (আপনার নিজের URI দিয়ে প্রতিস্থাপন করুন)
const dbURI = "mongodb+srv://botreplitfb:irfan2024@cluster0.j4x32.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// MongoDB কানেকশন
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connection Successful");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error: ", err);
  });

// Express অ্যাপ সেটআপ
const app = express();
const port = 10000;

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Schema এবং Model
const messageSchema = new mongoose.Schema({
  input: String,
  reply: String
});

const Message = mongoose.model('Message', messageSchema);

// /teach রুট - SMS টিচ করা
app.post('/teach', async (req, res) => {
  try {
    const { input, reply } = req.body;
    
    // নতুন মেসেজ ডকুমেন্ট তৈরি
    const message = new Message({
      input: input.toLowerCase(),
      reply: reply
    });
    
    await message.save();  // ডাটাবেজে সংরক্ষণ
    res.status(201).send({ message: 'Teach command successful' });

    console.log(`Teach message saved: ${input} -> ${reply}`);
  } catch (err) {
    console.error("Error saving teach message:", err);
    res.status(500).send({ error: 'Failed to teach the message' });
  }
});

// /delete রুট - SMS ডিলিট করা
app.delete('/delete', async (req, res) => {
  try {
    const { input } = req.body;

    const message = await Message.findOneAndDelete({ input: input.toLowerCase() });

    if (!message) {
      return res.status(404).send({ error: 'Message not found' });
    }

    res.status(200).send({ message: 'Message deleted successfully' });
    console.log(`Message deleted: ${input}`);
  } catch (err) {
    console.error("Error deleting message:", err);
    res.status(500).send({ error: 'Failed to delete the message' });
  }
});

// /teach-stats রুট - টিচ করা মেসেজ দেখতে হবে
app.get('/teach-stats', async (req, res) => {
  try {
    const messages = await Message.find({});
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching teach stats:", err);
    res.status(500).send({ error: 'Failed to fetch teach stats' });
  }
});

// সার্ভার চালু
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
