const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a high-risk alert email
 * @param {string} to - Recipient email (e.g. admin)
 * @param {Object} alertData - Data about the alert
 */
const sendAlertEmail = async (to, alertData) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Email not sent: EMAIL_USER or EMAIL_PASS not configured in .env');
    return;
  }

  const { finalScore, reasons, userEmail, flaggedAt } = alertData;

  const mailOptions = {
    from: `"Audit Monitoring System" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🚨 HIGH RISK ALERT: User Activity Flagged (${finalScore}/100)`,
    html: `
      <h2>High Risk Activity Detected</h2>
      <p>A user activity has been flagged by the Audit Monitoring System with a <strong>High Risk</strong> score.</p>
      <br/>
      <ul>
        <li><strong>User:</strong> ${userEmail}</li>
        <li><strong>Risk Score:</strong> <span style="color: red;">${finalScore}</span></li>
        <li><strong>Time:</strong> ${new Date(flaggedAt).toLocaleString()}</li>
      </ul>
      <h3>Detection Reasons:</h3>
      <ul>
        ${reasons.map(r => `<li>${r}</li>`).join('')}
      </ul>
      <br/>
      <p>Please log in to the AMS Dashboard to review and resolve this alert.</p>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Alert email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error('📧 Error sending alert email:', error);
  }
};

module.exports = {
  sendAlertEmail,
};
