const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== EMAIL CONFIG ==========
// You MUST fill these in for email to work.
// For Gmail: enable 2FA, then create an "App Password"
// https://myaccount.google.com/apppasswords
const EMAIL_USER = 'enxndjdmxnxn@gmail.com';   // your gmail
const EMAIL_PASS = 'errtvmdxkeqxadug';           // 16-character app password
const NOTIFY_TO  = 'enxndjdmxnxn@gmail.com';   // where to send the notification

// Create transporter (only works after you put real credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: get real client IP
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    'Unknown'
  );
}

// Route that records the visit and emails the IP
app.post('/notify', async (req, res) => {
  const ip = getClientIP(req);
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const time = new Date().toLocaleString();

  console.log(`[VISIT] ${time} | IP: ${ip} | UA: ${userAgent}`);

  // Try to send email
  try {
    await transporter.sendMail({
      from: `"Visit Notifier" <${EMAIL_USER}>`,
      to: NOTIFY_TO,
      subject: `New visit from ${ip}`,
      text: `Someone visited your page.\n\nIP: ${ip}\nTime: ${time}\nUser-Agent: ${userAgent}`,
      html: `
        <h2>New Visit</h2>
        <p><strong>IP:</strong> ${ip}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>User-Agent:</strong> ${userAgent}</p>
      `
    });
    console.log('Email sent successfully');
    res.json({ success: true, message: 'Notification sent' });
  } catch (err) {
    console.error('Email failed:', err.message);
    // Still return success to the page so it doesn't look broken
    res.json({ success: false, message: 'Logged, but email failed (check credentials)' });
  }
});

// Serve the page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Remember to set EMAIL_PASS in server.js for email to work');
});
