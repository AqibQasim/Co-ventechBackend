require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.error("MongoDB connection error: ", err));

const ContactForm = mongoose.model('ContactForm', {
    Name: String,
    Email: String,
    Subject: String,
    Message: String,
});

app.use(cors({ origin: '*' }));
app.options('*', cors());
app.use(bodyParser.json());

app.get('/', async (req, res) => {
    try {
        const formSubmissions = await ContactForm.find();
        res.status(200).json({ success: true, data: formSubmissions });
    } catch (error) {
        console.error('Error fetching form submissions:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/', async (req, res) => {
    try {
        const { Name, Email, Subject, Message } = req.body;
        const contactEntry = new ContactForm({ Name, Email, Subject, Message });
        await contactEntry.save();

        console.log('Received form submission:', req.body);

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.MAIL_PORT,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.MAIL_USER, // This should be the same as the MAIL_USER
            to: 'sales@co-ventech.com',
            subject: `Contact Form - ${Subject}`,
            text: `Name: ${Name}\nEmail: ${Email}\nSubject: ${Subject}\nMessage: ${Message}`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
        res.status(200).json({ success: true, message: 'Form data saved and email sent successfully' });
    } catch ( error ) {
        console.error('Error processing form:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
