const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 2040;

// MongoDB URI - আপনার MongoDB URI এখানে দিন
const MONGO_URI = 'mongodb+srv://irfan:irfana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan';

// MongoDB Schema এবং Model তৈরি
const answerSchema = new mongoose.Schema({
  ask: { type: String, required: true },
  answers: [{ type: String }]
});
const Answer = mongoose.model('Answer', answerSchema);

// MongoDB এর সাথে সংযোগ স্থাপন
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());  // JSON প্যারামিটার পাওয়ার জন্য

// Default random responses in case input is not found
const randomResponses = [
  "I don't know the answer to that.",
  "Can you teach me?",
  "I'm not sure, but I'm learning!",
  "Interesting question! Try again.",
  "I'm still learning. Can you help?"
];

// Route to get a response based on user input
app.get('/chat', async (req, res) => {
  try {
    const ask = req.query.ask?.toLowerCase();
    let response;

    if (ask) {
      const result = await Answer.findOne({ ask: ask });
      if (result) {
        const randomIndex = Math.floor(Math.random() * result.answers.length);
        response = result.answers[randomIndex];
      } else {
        response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
      }
    } else {
      response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
    }

    return res.json({ respond: response, Author: 'Anthony' });
  } catch (error) {
    console.error("Error in /chat route:", error);
    return res.status(500).json({ respond: 'Internal Server Error', Author: 'Anthony' });
  }
});

// Route to teach the system new responses
app.get('/teach', async (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const ans = req.query.ans;
  
  if (!ask || !ans) {
    return res.json({ err: 'Missing ask or ans query!', Author: 'Anthony' });
  }

  try {
    let result = await Answer.findOne({ ask: ask });
    
    if (!result) {
      result = new Answer({ ask: ask, answers: [] });
    }

    // Ensure the answer doesn't already exist
    if (!result.answers.includes(ans)) {
      result.answers.push(ans);
      await result.save();  // Save to MongoDB
    }

    return res.json({ message: Taught: "${ans}" for "${ask}", Author: 'Anthony' });
  } catch (error) {
    console.error("Error in /teach route:", error);
    return res.status(500).json({ err: 'Failed to teach', Author: 'Anthony' });
  }
});

// Secret route to download JSON data
const SECRET_ROUTE = Buffer.from('secret_route', 'utf8').toString('base64');
app.get('/' + SECRET_ROUTE, async (req, res) => {
  try {
    res.setHeader('Content-Disposition', 'attachment; filename="sim.json"');
    res.setHeader('Content-Type', 'application/json');
    const data = await Answer.find();  // Get all data from MongoDB
    res.send(JSON.stringify(data, null, 4));  // Send the data as JSON
  } catch (error) {
    console.error("Error in secret route:", error);
    return res.status(500).json({ error: 'Failed to process the download.', Author: 'Anthony' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(Server is running on http://localhost:${PORT});
});
