const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB URI সরাসরি কোডে দেওয়া
const uri = "mongodb+srv://irfan:irfana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB-তে সফলভাবে সংযোগ হয়েছে!");
  } catch (error) {
    console.error("MongoDB-তে সংযোগে সমস্যা:", error);
  }
}

run().catch(console.dir);

const app = express();
const PORT = 2040; // পোর্ট সরাসরি কোডে সেট করা

app.use(express.static(path.join(__dirname, 'public')));

// ডিফল্ট রেসপন্স (যদি ইনপুট না থাকে)
const randomResponses = [
  "আমি তার উত্তর জানি না।",
  "আপনি আমাকে শিখাতে পারেন?",
  "আমি নিশ্চিত না, তবে আমি শিখছি!",
  "আসলেই মজার প্রশ্ন! আবার চেষ্টা করুন।",
  "আমি এখনও শিখছি। আপনি কি সাহায্য করতে পারেন?"
];

// MongoDB সংযোগ
const database = client.db("chatDB");
const collection = database.collection("responses");

// ফাইল আছে কিনা চেক করার ফাংশন
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// রুট: ব্যবহারকারীর প্রশ্নের ভিত্তিতে উত্তর প্রদান
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
        response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
      }
    } else {
      response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
    }

    return res.json({ respond: response, Author: 'IRFAN' });
  } catch (error) {
    console.error("Error in /chat route:", error);
    return res.status(500).json({ respond: 'Internal Server Error', Author: 'IRFAN' });
  }
});

// রুট: নতুন উত্তর শেখানোর জন্য
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

// Start the server
app.listen(PORT, () => {
  console.log(Server is running on http://localhost:${PORT});
});
