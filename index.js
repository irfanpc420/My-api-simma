const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const app = express();
const PORT = 3000;  // নতুন পোর্ট নম্বর
const DATA_PATH = path.join(__dirname, 'data', 'sim.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());  // JSON রিকোয়েস্ট হ্যান্ডেল করার জন্য

// Default random responses in case input is not found
const randomResponses = [
  "I don't know the answer to that.",
  "Can you teach me?",
  "I'm not sure, but I'm learning!",
  "Interesting question! Try again.",
  "I'm still learning. Can you help?"
];

// Check if file exists
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// Read JSON data
const readJSON = async () => {
  if (!(await fileExists(DATA_PATH))) return {};
  const fileContent = await fs.readFile(DATA_PATH, 'utf-8');
  return JSON.parse(fileContent);
};

// Write JSON data
const writeJSON = async (data) => {
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 4));
};

// Route to get a response based on user input
app.get('/chat', async (req, res) => {
  try {
    const data = await readJSON();
    const ask = req.query.ask?.toLowerCase();
    let response;

    if (ask && data[ask] && data[ask].length > 0) {
      const randomIndex = Math.floor(Math.random() * data[ask].length);
      response = data[ask][randomIndex];
    } else {
      response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
    }

    return res.json({ respond: response, Author: 'Anthony' });
  } catch (error) {
    console.error("Error in /chat route:", error);
    return res.status(500).json({ respond: 'Internal Server Error', Author: 'Anthony' });
  }
});

// Route to teach the system new responses
app.post('/teach', async (req, res) => {
  const { ask, ans } = req.body;

  if (!ask || !ans) {
    return res.json({ err: 'Missing `ask` or `ans` body parameter!', Author: 'Anthony' });
  }

  try {
    const data = await readJSON();
    if (!data[ask]) data[ask] = [];
    if (!data[ask].includes(ans)) {
      data[ask].push(ans);
      await writeJSON(data);
    }

    return res.json({ message: `Taught: "${ans}" for "${ask}"`, Author: 'Anthony' });
  } catch (error) {
    console.error("Error in /teach route:", error);
    return res.status(500).json({ err: 'Failed to teach', Author: 'Anthony' });
  }
});

// Secret route to download JSON data
const SECRET_ROUTE = Buffer.from('secret_route', 'utf8').toString('base64');
app.get('/' + SECRET_ROUTE, async (req, res) => {
  try {
    if (!fsSync.existsSync(DATA_PATH)) {
      return res.status(404).json({ error: 'Data file not found', Author: 'Anthony' });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="sim.json"');
    res.setHeader('Content-Type', 'application/json');
    res.sendFile(DATA_PATH);
  } catch (error) {
    console.error("Error in secret route:", error);
    return res.status(500).json({ error: 'Failed to process the download.', Author: 'Anthony' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
