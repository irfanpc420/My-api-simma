// .env ফাইল লোড করতে dotenv প্যাকেজ ব্যবহার করুন
require('dotenv').config();

// প্রয়োজনীয় প্যাকেজগুলো ইমপোর্ট করা
const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

// Mongo URI এবং Port কে .env ফাইল থেকে লোড করা
const mongoUri = process.env.MONGO_URI;
const PORT = process.env.PORT || 2040;

// MongoClient তৈরি করা
const client = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// MongoDB কানেকশন ফাংশন
async function run() {
  try {
    // MongoDB কানেক্ট করা
    await client.connect();
    // পিং পাঠানো চেক করার জন্য
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

run().catch(console.dir);

// Express অ্যাপ্লিকেশন শুরু করা
const app = express();

// স্ট্যাটিক ফাইলের জন্য Public ফোল্ডার যুক্ত করা
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB এর ডাটাবেজ এবং কোলেকশন নির্বাচন করা
const database = client.db("chatDB");
const collection = database.collection("responses");

// রুট তৈরি করা - প্রশ্নের উত্তর ফেরত দেয়
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
        response = "I don't know the answer to that.";
      }
    } else {
      response = "Please ask a question!";
    }

    return res.json({ respond: response, Author: 'IRFAN' });
  } catch (error) {
    console.error("Error in /chat route:", error);
    return res.status(500).json({ respond: 'Internal Server Error', Author: 'IRFAN' });
  }
});

// টিচ রুট - নতুন প্রশ্ন ও উত্তর সেভ করার জন্য
app.get('/teach', async (req, res) => {
  const ask = req.query.ask?.toLowerCase();
  const ans = req.query.ans;
  
  if (!ask || !ans) {
    return res.json({ err: 'Missing ask or ans query!', Author: 'IRFAN' });
  }

  try {
    const existingData = await collection.findOne({ ask });

    if (existingData) {
      if (!existingData.responses.includes(ans)) {
        await collection.updateOne(
          { ask },
          { $push: { responses: ans } }
        );
        return res.json({ message: Taught: "${ans}" for "${ask}", Author: 'IRFAN' });
      } else {
        return res.json({ message: "${ans}" is already taught for "${ask}", Author: 'IRFAN' });
      }
    } else {
      await collection.insertOne({ ask, responses: [ans] });
      return res.json({ message: Taught: "${ans}" for "${ask}", Author: 'IRFAN' });
    }
  } catch (error) {
    console.error("Error in /teach route:", error);
    return res.status(500).json({ err: 'Failed to teach', Author: 'IRFAN' });
  }
});

// Secret route to download JSON data
const SECRET_ROUTE = Buffer.from('secret_route', 'utf8').toString('base64');
app.get('/' + SECRET_ROUTE, async (req, res) => {
  try {
    res.setHeader('Content-Disposition', 'attachment; filename="sim.json"');
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(path.join(__dirname, 'data', 'sim.json'));
  } catch (error) {
    console.error("Error in secret route:", error);
    return res.status(500).json({ error: 'Failed to process the download.', Author: 'IRFAN' });
  }
});

// সাইট চলাতে হবে
app.listen(PORT, () => {
  console.log(Server is running on http://localhost:${PORT});
});
