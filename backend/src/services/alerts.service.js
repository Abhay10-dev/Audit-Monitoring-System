const { query } = require('../db/db');
const { sendAlertEmail } = require('./email.service');

/**
 * Generate an alert for a high-risk anomaly and send notifications.
 *
 * @param {Object} anomaly - The persisted anomaly object
 * @param {string} userEmail - Email of the user who triggered the anomaly
 */
const generateAlert = async (anomaly, userEmail) => {
  try {
    // 1. Persist the alert in the database
    const { rows } = await query(
      `INSERT INTO alerts (user_id, anomaly_id, status)
       VALUES ($1, $2, 'new')
       RETURNING *`,
      [anomaly.user_id, anomaly.id]
    );

    const alert = rows[0];
    console.log(`🚨 Alert Created [ID: ${alert.id}] for User ${anomaly.user_id}`);

    // 2. Send email notification to Admin (and potentially manager later)
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (adminEmail) {
      await sendAlertEmail(adminEmail, {
        finalScore: anomaly.final_score,
        reasons: JSON.parse(anomaly.reasons),
        userEmail: userEmail,
        flaggedAt: anomaly.flagged_at,
      });
    }

    return alert;
  } catch (error) {
    console.error('Error generating alert:', error);
    // Fail silently so we don't disrupt the main flow
    return null;
  }
};

module.exports = {
  generateAlert,
};
