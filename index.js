const express = require('express');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 2040;

// MongoDB URI থেকে কানেকশন তৈরি
const client = new MongoClient(process.env.MONGO_URI);

// ডাটাবেসে কানেকশন চেক করার ফাংশন
const connectToDb = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
  }
};

// Express মিডলওয়্যার
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// MongoDB ডাটাবেসের কলেকশন
const database = client.db('chatDB');
const collection = database.collection('responses');

// /chat রাউট: প্রশ্নের উত্তর দিতে
app.get('/chat', async (req, res) => {
  const ask = req.query.ask?.toLowerCase();

  try {
    if (ask) {
      // MongoDB থেকে উত্তর খুঁজে নেওয়া
      const data = await collection.findOne({ ask });
      if (data && data.responses.length > 0) {
        // রেসপন্সের মধ্যে থেকে একটি র্যান্ডম উত্তর দেখানো
        const randomIndex = Math.floor(Math.random() * data.responses.length);
        return res.json({ respond: data.responses[randomIndex], Author: 'IRFAN' });
      } else {
        return res.json({ respond: "I don't know the answer to that.", Author: 'IRFAN' });
      }
    }
    return res.json({ respond: "Please ask a question.", Author: 'IRFAN' });
  } catch (error) {
    console.error("Error in /chat route:", error);
    return res.status(500).json({ respond: 'Internal Server Error', Author: 'IRFAN' });
  }
});

// /teach রাউট: নতুন ডাটা টিচ করা
app.get('/teach', async (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const ans = req.query.ans;

  if (!ask || !ans) {
    return res.json({ err: 'Missing ask or ans query!', Author: 'IRFAN' });
  }

  try {
    // MongoDB-তে প্রশ্নের জন্য উত্তর সংরক্ষণ করা
    const existingData = await collection.findOne({ ask });

    if (existingData) {
      // যদি উত্তর ইতিমধ্যেই থাকলে, নতুন ডাটা যোগ করা
      if (!existingData.responses.includes(ans)) {
        await collection.updateOne({ ask }, { $push: { responses: ans } });
        return res.json({ message: Taught: "${ans}" for "${ask}", Author: 'IRFAN' });
      } else {
        return res.json({ message: "${ans}" is already taught for "${ask}", Author: 'IRFAN' });
      }
    } else {
      // যদি প্রশ্ন না থাকে তবে নতুন প্রশ্ন এবং উত্তর যুক্ত করা
      await collection.insertOne({ ask, responses: [ans] });
      return res.json({ message: Taught: "${ans}" for "${ask}", Author: 'IRFAN' });
    }
  } catch (error) {
    console.error("Error in /teach route:", error);
    return res.status(500).json({ err: 'Failed to teach', Author: 'IRFAN' });
  }
});

// ডাটা ফাইল সেভ করা /saveData রাউট
app.get('/saveData', async (req, res) => {
  const data = req.query.data;

  if (!data) {
    return res.json({ err: 'No data to save!', Author: 'IRFAN' });
  }

  try {
    const dataFilePath = path.join(__dirname, 'data', 'sim.json');
    const fileData = fs.existsSync(dataFilePath) ? JSON.parse(fs.readFileSync(dataFilePath, 'utf-8')) : {};
    fileData.savedData = data;

    // ডাটা ফাইল আপডেট করা
    fs.writeFileSync(dataFilePath, JSON.stringify(fileData, null, 2));
    return res.json({ message: 'Data saved successfully!', Author: 'IRFAN' });
  } catch (error) {
    console.error("Error in /saveData route:", error);
    return res.status(500).json({ err: 'Failed to save data', Author: 'IRFAN' });
  }
});

// MongoDB কানেক্ট হওয়া পর সার্ভার শুরু করা
connectToDb().then(() => {
  app.listen(PORT, () => {
    console.log(Server is running on http://localhost:${PORT});
  });
});
