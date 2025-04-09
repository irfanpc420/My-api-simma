const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Static files served from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route for HTML page (example for index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

// Example for serving JS files dynamically based on the filename
// This will serve any file in /public/js that ends with .js
app.get('/js/*', (req, res) => {
    const jsFile = req.params[0]; // Capture the file name after /js/
    if (jsFile.endsWith('.js')) {
        res.sendFile(path.join(__dirname, 'public', 'js', jsFile));
    } else {
        res.status(404).send('JavaScript file not found.');
    }
});

// Example for serving CSS files dynamically based on the filename
// This will serve any file in /public/css that ends with .css
app.get('/css/*', (req, res) => {
    const cssFile = req.params[0]; // Capture the file name after /css/
    if (cssFile.endsWith('.css')) {
        res.sendFile(path.join(__dirname, 'public', 'css', cssFile));
    } else {
        res.status(404).send('CSS file not found.');
    }
});

// Media files (images, etc.)
app.get('/media/*', (req, res) => {
    const mediaFile = req.params[0]; // Capture the file name after /media/
    res.sendFile(path.join(__dirname, 'public', 'media', mediaFile));
});

// JSON files (for example, data.json)
app.get('/json/*', (req, res) => {
    const jsonFile = req.params[0]; // Capture the file name after /json/
    res.sendFile(path.join(__dirname, 'public', 'json', jsonFile));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
