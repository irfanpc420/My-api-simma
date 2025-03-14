const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');

// Data file path
const DATA_FILE = 'data.json';

// Initialize data.json if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
}

// Load data from JSON file
function loadData() {
    try {
        const rawData = fs.readFileSync(DATA_FILE);
        return JSON.parse(rawData);
    } catch (error) {
        return {};
    }
}

// Save data to JSON file
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

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
            let data = loadData();

            if (!data[normalizedInput]) {
                data[normalizedInput] = [];
            }

            if (!data[normalizedInput].includes(response)) {
                data[normalizedInput].push(response);
                saveData(data);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: `Response added: "${response}"` }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: `Response already exists: "${response}"` }));
            }
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
