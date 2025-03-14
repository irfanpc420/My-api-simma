const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const cors = require('cors');

// MongoDB Atlas Connection URI
const uri = 'mongodb+srv://Irfan2025:manha2025@cluster0.v3t0i.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// MongoDB সংযোগ স্থাপন
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB Connected');
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
    });

// SMS Schema তৈরি করা
const smsSchema = new mongoose.Schema({
    input: { type: String, required: true },
    reply: { type: String, required: true }, // Reply field added
    isLearned: { type: Boolean, default: false }
});

// SMS Model তৈরি করা
const Sms = mongoose.model('Sms', smsSchema);

app.use(cors());
app.use(express.json());

// Serve Static HTML File
app.use(express.static(path.join(__dirname, 'public')));

// Root Route - Test API
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Teach Route - SMS টিচ করা
app.post('/teach', async (req, res) => {
    const { input, reply } = req.body;
    if (!input || !reply) {
        return res.status(400).send({ error: 'Input message and reply are required' });
    }

    const existingMessage = await Sms.findOne({ input: input.toLowerCase() });
    if (existingMessage) {
        return res.status(400).send({ message: 'Message already learned' });
    }

    const newMessage = new Sms({ input: input.toLowerCase(), reply: reply, isLearned: true });
    await newMessage.save();
    res.status(200).send({ message: 'Message learned successfully' });
});

// Check Route - SMS টিচ করা হয়েছে কিনা চেক করা
app.get('/check/:message', async (req, res) => {
    const { message } = req.params;
    const sms = await Sms.findOne({ input: message.toLowerCase() });
    
    if (!sms) {
        return res.status(404).send({ message: 'Message not found' });
    }
    
    res.status(200).send({ message: `This message is ${sms.isLearned ? 'learned' : 'not learned'}` });
});

// Reply Route - টিচ করা মেসেজ অনুযায়ী রিপ্লাই দেওয়া
app.get('/reply/:message', async (req, res) => {
    const { message } = req.params;
    const sms = await Sms.findOne({ input: message.toLowerCase() });

    if (!sms) {
        return res.status(404).send({ message: 'No reply found for this message' });
    }

    res.status(200).send({ reply: sms.reply });
});

// Delete Route - SMS ডিলিট করা
app.delete('/delete/:message', async (req, res) => {
    const { message } = req.params;
    
    const result = await Sms.deleteOne({ input: message.toLowerCase() });
    if (result.deletedCount === 0) {
        return res.status(404).send({ message: 'Message not found' });
    }

    res.status(200).send({ message: 'Message deleted successfully' });
});

// Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
