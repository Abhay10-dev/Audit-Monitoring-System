const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { requireAuth, requireManager, requireAdmin } = require('../middlewares/auth.middleware');

/**
 * GET /api/alerts
 * List all alerts. Filter by status, user, or date.
 * Employee can only see their own alerts. Manager/Admin see all.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let queryStr = `
      SELECT al.id, al.status, al.created_at,
             an.final_score, an.reasons,
             u.email, u.id as user_id
      FROM alerts al
      JOIN anomalies an ON al.anomaly_id = an.id
      JOIN users u ON an.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    // RBAC filter
    if (req.user.role === 'employee') {
      queryStr += ` AND an.user_id = $${paramIndex++}`;
      queryParams.push(req.user.id);
    }

    if (status) {
      queryStr += ` AND al.status = $${paramIndex++}`;
      queryParams.push(status);
    }

    // Count for pagination
    const countQuery = `SELECT COUNT(*) FROM (${queryStr}) AS filtered_alerts`;
    const { rows: countRows } = await query(countQuery, queryParams);
    const total = parseInt(countRows[0].count);

    queryStr += ` ORDER BY al.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    queryParams.push(limit, offset);

    const { rows } = await query(queryStr, queryParams);

    res.json({
      data: rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/alerts/:id
 * Update alert status: 'new', 'acknowledged', 'resolved'
 * Managers & Admins only.
 */
router.patch('/:id', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['new', 'acknowledged', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const { rows } = await query(
      `UPDATE alerts SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/alerts/:id/feedback
 * Admins mark alert as true_positive or false_positive to help retrain the ML model.
 */
router.post('/:id/feedback', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { label } = req.body; // 'true_positive' or 'false_positive'

    if (!['true_positive', 'false_positive'].includes(label)) {
      return res.status(400).json({ error: 'Label must be true_positive or false_positive' });
    }

    const { rows } = await query(
      `INSERT INTO feedback (alert_id, admin_id, label)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user.id, label === 'true_positive'] // store boolean for label
    );

    res.json({ message: 'Feedback recorded successfully', feedback: rows[0] });
  } catch (error) {
    console.error('Error recording feedback:', error);
    // Ignore unique constraint error if feedback already exists for this alert
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Feedback already provided for this alert' });
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
