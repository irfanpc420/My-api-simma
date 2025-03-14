const http = require('http');
const { MongoClient } = require('mongodb');
const url = require('url');
const fs = require('fs');
const path = require('path');

// MongoDB Connection URI (আপনার URI এখানে বসাবেন)
const MONGO_URI = 'mongodb+srv://g66166566:irfan2@24@cluster0.v3t0i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DB_NAME = 'teachBot';  // আপনার ডাটাবেসের নাম
const COLLECTION_NAME = 'responses';  // যেই কালেকশনে ডাটা সেভ করবেন

let db;
let responsesCollection;

// MongoDB কানেকশন সেটআপ
MongoClient.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to MongoDB');
        db = client.db(DB_NAME);
        responsesCollection = db.collection(COLLECTION_NAME);
    })
    .catch(err => {
        console.error('Failed to connect to MongoDB', err);
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

        req.on('end', () => {
            const { input, response } = JSON.parse(body);

            if (!input || !response) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Input and response are required.' }));
                return;
            }

            const normalizedInput = input.toLowerCase();

            // MongoDB তে সেভ করা
            responsesCollection.findOne({ input: normalizedInput })
                .then(existingResponse => {
                    if (existingResponse) {
                        if (!existingResponse.responses.includes(response)) {
                            // যদি একই রেসপন্স না থাকে তবে অ্যাড করা
                            responsesCollection.updateOne(
                                { input: normalizedInput },
                                { $push: { responses: response } }
                            )
                            .then(() => {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ message: `Response added: "${response}"` }));
                            })
                            .catch(err => {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Failed to save response' }));
                            });
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: `Response already exists: "${response}"` }));
                        }
                    } else {
                        // যদি নতুন ইনপুট থাকে তবে ইনপুট ও রেসপন্স সেভ করা
                        responsesCollection.insertOne({
                            input: normalizedInput,
                            responses: [response]
                        })
                        .then(() => {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: `Response added: "${response}"` }));
                        })
                        .catch(err => {
                            res.writeHead(500, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ error: 'Failed to save response' }));
                        });
                    }
                })
                .catch(err => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Database error' }));
                });
        });
    }
    else if (pathname === '/delete' && req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {
            const { input, response } = JSON.parse(body);

            if (!input || !response) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Input and response are required.' }));
                return;
            }

            const normalizedInput = input.toLowerCase();

            // MongoDB থেকে ডিলিট করা
            responsesCollection.findOne({ input: normalizedInput })
                .then(existingResponse => {
                    if (existingResponse) {
                        const responseIndex = existingResponse.responses.indexOf(response);
                        if (responseIndex > -1) {
                            responsesCollection.updateOne(
                                { input: normalizedInput },
                                { $pull: { responses: response } }
                            )
                            .then(() => {
                                res.writeHead(200, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ message: `Response deleted: "${response}"` }));
                            })
                            .catch(err => {
                                res.writeHead(500, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ error: 'Failed to delete response' }));
                            });
                        } else {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify({ message: `Response not found: "${response}"` }));
                        }
                    } else {
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Input not found' }));
                    }
                })
                .catch(err => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Database error' }));
                });
        });
    }
    else {
        // Handle 404
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
});

// Start server
const port = 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
