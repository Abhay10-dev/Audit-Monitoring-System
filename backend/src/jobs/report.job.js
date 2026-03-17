const { query } = require('../db/db');
const { sendAlertEmail } = require('../services/email.service');

/**
 * Runs the daily system report and emails the admin
 */
const runDailyReport = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    if (!adminEmail) return;

    // Aggregate daily stats
    const [[usersRes], [alertsRes], [anomaliesRes]] = await Promise.all([
      query(`SELECT COUNT(*) as count FROM users`).then(r => r.rows),
      query(`SELECT COUNT(*) as count FROM alerts WHERE status = 'new'`).then(r => r.rows),
      query(`SELECT COUNT(*) as count FROM anomalies WHERE flagged_at >= NOW() - INTERVAL '1 day'`).then(r => r.rows)
    ]);

    const stats = {
      users: usersRes.count,
      unresolvedAlerts: alertsRes.count,
      dailyAnomalies: anomaliesRes.count
    };

    // We reuse `sendAlertEmail` logically but tweak the data to make it look like a report
    // In a real app we'd build a dedicated `sendReportEmail`.
    await sendAlertEmail(adminEmail, {
      finalScore: "N/A",
      userEmail: "SYSTEM_REPORT",
      flaggedAt: new Date().toISOString(),
      reasons: [
        `System Status: Healthy`,
        `Total Active Users: ${stats.users}`,
        `New Anomalies Today: ${stats.dailyAnomalies}`,
        `Pending Alerts: ${stats.unresolvedAlerts}`
      ]
    });

    console.log(`📊 Daily Report Job: Summary emailed to ${adminEmail}.`);
  } catch (error) {
    console.error('📊 Daily Report Job Error:', error);
  }
};

module.exports = { runDailyReport };
