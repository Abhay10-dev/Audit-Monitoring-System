const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/rbac.middleware');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

/**
 * Helper: Gets dates roughly X days ago to today
 */
const getPastDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

/**
 * GET /api/analytics/login-trends
 * Time-series count of 'login' events over the last X days (default 7)
 */
router.get('/login-trends', requireAuth, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = getPastDate(days);

    const { rows } = await query(
      `SELECT DATE_TRUNC('day', timestamp) as date, COUNT(*) as count
       FROM activity_logs
       WHERE action = 'login' AND timestamp >= $1
       GROUP BY DATE_TRUNC('day', timestamp)
       ORDER BY date ASC`,
      [startDate]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching login trends:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/analytics/risk-distribution
 * Counts of active user risk levels based on their most recent anomaly score.
 */
router.get('/risk-distribution', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(`
      WITH RecentAnomalies AS (
        SELECT user_id, final_score,
               ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY flagged_at DESC) as rn
        FROM anomalies
      )
      SELECT 
        CASE 
          WHEN final_score > 70 THEN 'High'
          WHEN final_score > 30 THEN 'Medium'
          ELSE 'Low'
        END as risk_level,
        COUNT(user_id) as count
      FROM RecentAnomalies
      WHERE rn = 1
      GROUP BY risk_level
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching risk distribution:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/analytics/anomaly-trends
 * Daily average ML score or count of anomalies.
 */
router.get('/anomaly-trends', requireAuth, requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = getPastDate(days);

    const { rows } = await query(
      `SELECT DATE_TRUNC('day', flagged_at) as date, 
              ROUND(AVG(ml_score * 100)) as avg_score,
              COUNT(*) as count
       FROM anomalies
       WHERE flagged_at >= $1
       GROUP BY DATE_TRUNC('day', flagged_at)
       ORDER BY date ASC`,
      [startDate]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error fetching anomaly trends:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/analytics/alerts-summary
 * Count of alerts by status
 */
router.get('/alerts-summary', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT status, COUNT(*) as count
      FROM alerts
      GROUP BY status
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching alerts summary:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/analytics/user-risk/:id
 * Risk score history for a specific user.
 */
router.get('/user-risk/:id', requireAuth, async (req, res) => {
  try {
    // Users can see their own, admins/managers can see all
    if (req.user.role === 'employee' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await query(
      `SELECT flagged_at, final_score, ml_score, rule_score
       FROM anomalies
       WHERE user_id = $1
       ORDER BY flagged_at ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user risk history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ── Reports ─────────────────────────────────────────────────────────────

/**
 * GET /api/analytics/report/csv
 * Export recent anomalies to CSV
 */
router.get('/report/csv', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT a.id, a.flagged_at, a.final_score, a.reasons, u.email
      FROM anomalies a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.flagged_at DESC
      LIMIT 1000
    `);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    const fields = ['id', 'email', 'final_score', 'flagged_at', 'reasons'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(rows);

    res.header('Content-Type', 'text/csv');
    res.attachment('risk_report.csv');
    return res.send(csv);

  } catch (error) {
    console.error('Error generating CSV:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/analytics/report/pdf
 * Export system health summary to PDF using PDFKit
 */
router.get('/report/pdf', requireAuth, requireAdmin, async (req, res) => {
  try {
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=ams_system_report.pdf');
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('AuditMS Security Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    // Fetch brief stats
    const [usersRes, alertsRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM users`),
      query(`SELECT COUNT(*) FROM alerts WHERE status = 'new'`)
    ]);

    doc.fontSize(14).text('Quick Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Total Registered Users: ${usersRes.rows[0].count}`);
    doc.text(`Active Unresolved Alerts: ${alertsRes.rows[0].count}`);
    doc.moveDown(2);

    // Recent critical alerts
    const { rows: critical } = await query(`
      SELECT u.email, a.final_score, a.flagged_at 
      FROM anomalies a JOIN users u ON a.user_id = u.id 
      WHERE a.final_score > 70 
      ORDER BY a.flagged_at DESC LIMIT 5
    `);

    doc.fontSize(14).text('Recent High Risk Events', { underline: true });
    doc.moveDown();

    if (critical.length === 0) {
      doc.fontSize(12).text('No recent high risk events detected.');
    } else {
      critical.forEach((evt, i) => {
        const date = new Date(evt.flagged_at).toLocaleString();
        doc.fontSize(11).text(`${i+1}. ${evt.email} - Risk Score: ${evt.final_score} (${date})`);
      });
    }

    doc.end();

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

module.exports = router;
