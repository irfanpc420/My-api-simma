// প্রয়োজনীয় প্যাকেজ ইমপোর্ট করা
const express = require('express');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// MongoDB URI এবং Port এর মান সরাসরি কোডে দেওয়া
const mongoUri = 'mongodb+srv://irfan:ifana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan';
const PORT = 2040;

// MongoClient তৈরি করা
const client = new MongoClient(mongoUri);

// MongoDB কানেক্ট ফাংশন
async function run() {
  try {
    await client.connect();
    await client.db('admin').command({ ping: 1 });
    console.log('Successfully connected to MongoDB!');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

run().catch(console.dir);

// Express অ্যাপ্লিকেশন তৈরি করা
const app = express();

// স্ট্যাটিক ফাইল সার্ভ করার জন্য public ফোল্ডার যুক্ত করা
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB ডাটাবেজ এবং কোলেকশন নির্বাচন
const database = client.db('chatDB');
const collection = database.collection('responses');

// GET রুট: চ্যাট রেসপন্স প্রদান
app.get('/chat', async (req, res) => {
  try {
    const ask = req.query.ask?.toLowerCase();
    let response;

    if (ask) {
      const data = await collection.findOne({ ask });
      if (data && data.responses.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.responses.length);
        response = data.responses[randomIndex];
      } else {
        response = "Sorry, I don't have an answer to that question.";
      }
    } else {
      response = "Please ask a question!";
    }

    return res.json({ response, Author: 'IRFAN' });
  } catch (error) {
    console.error("Error in /chat route:", error);
    return res.status(500).json({ response: 'Internal Server Error', Author: 'IRFAN' });
  }
});

// GET রুট: নতুন প্রশ্ন ও উত্তর টিচ করা
app.get('/teach', async (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const ans = req.query.ans;

  if (!ask || !ans) {
    return res.json({ error: 'Missing `ask` or `ans` query!', Author: 'IRFAN' });
  }

  try {
    const existingData = await collection.findOne({ ask });

    if (existingData) {
      if (!existingData.responses.includes(ans)) {
        await collection.updateOne(
          { ask },
          { $push: { responses: ans } }
        );
        return res.json({ message: `Taught: "${ans}" for "${ask}"`, Author: 'IRFAN' });
      } else {
        return res.json({ message: `"${ans}" is already taught for "${ask}"`, Author: 'IRFAN' });
      }
    } else {
      await collection.insertOne({ ask, responses: [ans] });
      return res.json({ message: `Taught: "${ans}" for "${ask}"`, Author: 'IRFAN' });
    }
  } catch (error) {
    console.error("Error in /teach route:", error);
    return res.status(500).json({ error: 'Failed to teach', Author: 'IRFAN' });
  }
});

// GET রুট: সিমুলেশন ডাটা ডাউনলোড করা
app.get('/download-sim', async (req, res) => {
  try {
    const simData = fs.readFileSync(path.join(__dirname, 'data', 'sim.json'), 'utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="sim.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(simData);
  } catch (error) {
    console.error('Error reading sim.json:', error);
    return res.status(500).json({ error: 'Failed to download simulation data', Author: 'IRFAN' });
  }
});

// ওয়েব সাইট চালু করা
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
