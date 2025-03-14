// Import required modules
const http = require('http');
const url = require('url');
const { MongoClient } = require('mongodb');

// MongoDB connection URL
const connectionString = 'mongodb+srv://botreplitfb:irfan2024@cluster0.j4x32.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(connectionString);
const DB_NAME = 'myDatabase'; // Replace with your database name
const COLLECTION_NAME = 'messages'; // Replace with your collection name

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  if (pathname === '/teach' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    
    req.on('end', async () => {
      try {
        const { input, responses } = JSON.parse(body);
        
        if (!input || !responses) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Both input and responses are required.' }));
          return;
        }

        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        // Insert or update the message
        const result = await collection.updateOne(
          { input: input.toLowerCase() },
          { $set: { responses: responses } },
          { upsert: true }
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Message taught successfully!' }));
      } catch (error) {
        console.error("Error teaching message:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to teach message.' }));
      } finally {
        await client.close();
      }
    });

  } else if (pathname === '/reply' && req.method === 'GET') {
    const { input } = parsedUrl.query;

    if (!input) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Input query parameter is required.' }));
      return;
    }

    try {
      await client.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);

      // Get the reply from the database
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
    } finally {
      await client.close();
    }

  } else if (pathname === '/delete' && req.method === 'DELETE') {
    const { input } = parsedUrl.query;

    if (!input) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Input query parameter is required.' }));
      return;
    }

    try {
      await client.connect();
      const db = client.db(DB_NAME);
      const collection = db.collection(COLLECTION_NAME);

      // Delete the message from the database
      const result = await collection.deleteOne({ input: input.toLowerCase() });

      if (result.deletedCount > 0) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: `Message with input "${input}" deleted successfully.` }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `No message found with input: "${input}"` }));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete message.' }));
    } finally {
      await client.close();
    }

  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Route not found' }));
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
