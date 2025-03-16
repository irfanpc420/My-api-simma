const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
const config = require('./config.json'); // config.json ফাইলটি ইনপোর্ট করা

// MongoDB URI (config.json থেকে লোড)
const uri = config.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Express অ্যাপ তৈরি
const app = express();
const PORT = config.PORT || 2040;  // config.json থেকে পোর্ট লোড করা

// Middleware (যেমন JSON প্যারামিটার পার্স করা)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB কানেকশন ফাংশন
async function connectToDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
}

// ডাটাবেসের কালেকশন
const database = client.db("chatDB");
const collection = database.collection("responses");

// ডিফল্ট এলোমেলো উত্তরগুলি
const randomResponses = [
  "I'm still learning. Can you teach me?",
  "Interesting question! Can you ask again?",
  "I don't know the answer, but I'm learning.",
  "Sorry, I don't have an answer for that yet.",
  "Can you help me learn this?"
];

// /chat রুট - ব্যবহারকারীর প্রশ্নের জন্য উত্তর ফেরত দেওয়া
app.get('/chat', async (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  try {
    let response;

    if (ask) {
      const data = await collection.findOne({ ask });
      if (data && data.responses.length > 0) {
        // র্যান্ডম উত্তর থেকে একটি নির্বাচন করা
        const randomIndex = Math.floor(Math.random() * data.responses.length);
        response = data.responses[randomIndex];
      } else {
        response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
      }
    } else {
      response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
    }

    res.json({ respond: response, Author: 'IRFAN' });
  } catch (error) {
    console.error("Error in /chat route:", error);
    res.status(500).json({ respond: 'Internal Server Error', Author: 'IRFAN' });
  }
});

// /teach রুট - নতুন উত্তর শেখানোর জন্য
app.get('/teach', async (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const ans = req.query.ans;

  if (!ask || !ans) {
    return res.status(400).json({ err: 'Missing ask or ans query!', Author: 'IRFAN' });
  }

  try {
    const existingData = await collection.findOne({ ask });

    if (existingData) {
      // যদি পূর্বের উত্তরটি না থাকে, তবে নতুন উত্তরটি যোগ করা হবে
      if (!existingData.responses.includes(ans)) {
        await collection.updateOne({ ask }, { $push: { responses: ans } });
        return res.json({ message: Taught: "${ans}" for "${ask}", Author: 'IRFAN' });
      } else {
        return res.json({ message: "${ans}" is already taught for "${ask}", Author: 'IRFAN' });
      }
    } else {
      // যদি প্রশ্নটি নতুন হয়, তবে নতুন ডাটা যোগ করা হবে
      await collection.insertOne({ ask, responses: [ans] });
      return res.json({ message: Taught: "${ans}" for "${ask}", Author: 'IRFAN' });
    }
  } catch (error) {
    console.error("Error in /teach route:", error);
    res.status(500).json({ err: 'Failed to teach', Author: 'IRFAN' });
  }
});

// সিক্রেট রুট - JSON ডাউনলোড করার জন্য
app.get('/' + config.SECRET_ROUTE, async (req, res) => {
  try {
    res.setHeader('Content-Disposition', 'attachment; filename="sim.json"');
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, 'data', 'sim.json'));
  } catch (error) {
    console.error("Error in secret route:", error);
    res.status(500).json({ error: 'Failed to process the download.', Author: 'IRFAN' });
  }
});

// সার্ভার শুরু
connectToDB().then(() => {
  app.listen(PORT, () => {
    console.log(Server is running on http://localhost:${PORT});
  });
}).catch(() => {
  // যদি MongoDB কানেক্ট না হয় তবে শুধুমাত্র ত্রুটি বার্তা প্রদর্শন হবে
  console.log("Unable to connect to MongoDB. But server is still running.");
  app.listen(PORT, () => {
    console.log(Server is running on http://localhost:${PORT});
  });
});
