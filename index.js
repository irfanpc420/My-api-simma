const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB URI directly in index.js
const MONGO_URI = "mongodb+srv://irfan:irfana@irfan.e3l2q.mongodb.net/?retryWrites=true&w=majority&appName=Irfan";
const client = new MongoClient(MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express();
const port = 2040;

app.use(express.json());

// API route to check MongoDB connection and handle teaching data
app.post('/teach', async (req, res) => {
  const { ask, ans } = req.body;

  if (!ask || !ans) {
    return res.status(400).json({ message: "Both 'ask' and 'ans' are required." });
  }

  try {
    // Connect to MongoDB
    await client.connect();
    
    // Store taught data to the sim.json file
    const dataFilePath = path.join(__dirname, 'data', 'sim.json');
    let existingData = [];

    if (fs.existsSync(dataFilePath)) {
      const fileData = fs.readFileSync(dataFilePath);
      existingData = JSON.parse(fileData);
    }

    // Add new taught data
    existingData.push({ ask, ans });

    // Save updated data to sim.json
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2));

    // Respond with the taught data
    return res.json({ message: Taught: "${ans}" for "${ask}", Author: 'IRFAN' });
  } catch (error) {
    console.error('Error while teaching:', error);
    return res.status(500).json({ message: 'Failed to save the taught data.' });
  } finally {
    // Close MongoDB client connection
    await client.close();
  }
});

// API route to reply to teach messages
app.post('/reply', async (req, res) => {
  const { ask } = req.body;

  if (!ask) {
    return res.status(400).json({ message: "'ask' is required to reply." });
  }

  try {
    // Check if the data exists
    const dataFilePath = path.join(__dirname, 'data', 'sim.json');
    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ message: 'No taught data available.' });
    }

    // Read the data from sim.json
    const fileData = fs.readFileSync(dataFilePath);
    const existingData = JSON.parse(fileData);

    // Find the matching 'ask' entry
    const taughtEntry = existingData.find(entry => entry.ask.toLowerCase() === ask.toLowerCase());

    if (!taughtEntry) {
      return res.status(404).json({ message: No answer found for "${ask}". });
    }

    // Send the reply message
    return res.json({ message: taughtEntry.ans });
  } catch (error) {
    console.error('Error while replying:', error);
    return res.status(500).json({ message: 'Failed to retrieve the reply.' });
  }
});

// API route to delete a taught message
app.delete('/delete', async (req, res) => {
  const { ask } = req.body;

  if (!ask) {
    return res.status(400).json({ message: "'ask' is required to delete." });
  }

  try {
    // Read and parse data from sim.json
    const dataFilePath = path.join(__dirname, 'data', 'sim.json');
    if (!fs.existsSync(dataFilePath)) {
      return res.status(404).json({ message: 'No taught data available.' });
    }

    const fileData = fs.readFileSync(dataFilePath);
    let existingData = JSON.parse(fileData);

    // Remove the taught entry based on the 'ask' key
    existingData = existingData.filter(entry => entry.ask.toLowerCase() !== ask.toLowerCase());

    // Save the updated data back to sim.json
    fs.writeFileSync(dataFilePath, JSON.stringify(existingData, null, 2));

    return res.json({ message: Successfully deleted taught message for "${ask}". });
  } catch (error) {
    console.error('Error while deleting:', error);
    return res.status(500).json({ message: 'Failed to delete the taught data.' });
  }
});

// Start the server
app.listen(port, async () => {
  try {
    // Connect to MongoDB
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    console.log(Server is running on port ${port});
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
});
