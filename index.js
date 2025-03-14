const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const { MongoClient } = require('mongodb');

// MongoDB Connection URL
const MONGO_URI = "mongodb+srv://botreplitfb:<db_password>@cluster0.j4x32.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Database and Collection Names
const DB_NAME = "chatbot";
const COLLECTION_NAME = "messages";

// Create MongoDB Client
const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB
client.connect()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // Serve static files (HTML, CSS, JS)
  if (pathname === '/' || pathname === '/index.html') {
    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf-8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error loading page');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(data);
    });
  }
  else if (pathname === '/teach' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      const { input, response } = JSON.parse(body);

      if (!input || !response) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Input and response are required.' }));
        return;
      }

      try {
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        const normalizedInput = input.toLowerCase();
        const existing = await collection.findOne({ input: normalizedInput });

        if (existing) {
          // Update response if input already exists
          const updateResult = await collection.updateOne(
            { input: normalizedInput },
            { $push: { responses: response } }
          );
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Response added: "${response}"` }));
        } else {
          // Insert new input-response pair
          const newMessage = { input: normalizedInput, responses: [response] };
          await collection.insertOne(newMessage);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `New message stored: "${input}"` }));
        }
      } catch (error) {
        console.error("Error teaching:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to save message.' }));
      }
    });
  }
  else if (pathname === '/delete' && req.method === 'POST') {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      const { input } = JSON.parse(body);

      if (!input) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Input is required to delete.' }));
        return;
      }

      try {
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        const result = await collection.deleteOne({ input: input.toLowerCase() });

        if (result.deletedCount === 1) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: `Message deleted: "${input}"` }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `No message found to delete for input: "${input}"` }));
        }
      } catch (error) {
        console.error("Error deleting:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to delete message.' }));
      }
    });
  }
  else if (pathname === '/reply' && req.method === 'GET') {
    const { input } = parsedUrl.query;

    if (!input) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Input query parameter is required.' }));
      return;
    }

    try {
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);

      const message = await collection.findOne({ input: input.toLowerCase() });

      if (message) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ input: message.input, responses: message.responses }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `No responses found for input: "${input}"` }));
      }
    } catch (error) {
      console.error("Error fetching reply:", error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch response.' }));
    }
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

// Start server
const port = 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
