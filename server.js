require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto'); // Added missing import

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // Serves frontend files

let otpStorage = {}; // Temporary storage for OTPs

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'request-resume.html'));
});

// Route to request OTP
app.post('/request-otp', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const otp = crypto.randomInt(100000, 999999); // Generate 6-digit OTP
    otpStorage[email] = { otp, expires: Date.now() + 5 * 60 * 1000 }; // OTP valid for 5 minutes

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Your OTP for Resume Request',
        text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error(`Error sending OTP: ${error.message}`);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// Route to verify OTP and send resume
app.post('/request-resume', async (req, res) => {
    const { name, email, phone, message, otp } = req.body;

    if (!otpStorage[email] || otpStorage[email].otp.toString().trim() !== otp.toString().trim()) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    delete otpStorage[email]; // Clear OTP after successful verification

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Piyush Singh Resume',
        text: `
Dear ${name},

Thank you for your interest. Please find my resume attached.

Here are the details you provided:
- 📧 Email: ${email}
- 📞 Phone: ${phone || 'Not Provided'}
- 📝 Message: ${message || 'No additional message provided'}

Best regards,
Piyush Singh
        `,
        attachments: [
            {
                filename: 'Piyush_Khati_Resume.docx',
                path: './files/Piyush_Khati_Resume.docx'
            }
        ]
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).send(`Dear ${name}, Resume sent successfully! Please check your inbox.`);
        
        setTimeout(() => {
            window.location.href = "https://piysing14.github.io/Piyush-Portfolio/";
        }, 2000); // 2-second delay for better flow
    } catch (error) {
        console.error(`Error sending resume: ${error.message}`);
        res.status(500).json({ error: 'Failed to send resume' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}/request-resume`);
});
