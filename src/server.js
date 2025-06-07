const express = require('express');
const EmailService = require('./emailService');

const app = express();
const emailService = new EmailService();

app.use(express.json());

// POST /send-email
// Body: { to: string, subject: string, body: string }
// Response: { emailId: string, status: string }
app.post('/send-email', async (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, and body' });
  }

  const emailId = `email-${Date.now()}`;
  try {
    await emailService.queueEmail(emailId, to, subject, body);
    res.status(202).json({ emailId, status: 'QUEUED' });
  } catch (error) {
    res.status(500).json({ emailId, status: 'FAILED', error: error.message });
  }
});

// GET /status/:emailId
// Response: { emailId: string, status: string, provider: string, timestamp: string, error: string }
app.get('/status/:emailId', (req, res) => {
  const { emailId } = req.params;
  const status = emailService.getEmailStatus(emailId);
  if (!status) {
    return res.status(404).json({ error: 'Email ID not found' });
  }
  res.status(200).json(status);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});