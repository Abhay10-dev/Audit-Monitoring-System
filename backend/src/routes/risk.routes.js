const express = require('express');
const router = express.Router();
const { query } = require('../db/db');
const { requireAuth, requireAdmin, requireManager } = require('../middlewares/auth.middleware');

/**
 * GET /api/risk/:userId
 * Fetch the latest risk score and history for a specific user.
 * Employees can only fetch their own risk. Admins/Managers can fetch anyone's.
 */
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // RBAC check: Users can only see their own risk unless they are Admin/Manager
    if (req.user.id !== userId && req.user.role === 'employee') {
      return res.status(403).json({ error: 'Forbidden. Cannot access other users risk data.' });
    }

    // Get the most recent high/medium anomaly as the "current" risk
    const { rows: latestRows } = await query(`
      SELECT final_score, risk_level, reasons, flagged_at 
      FROM anomalies 
      WHERE user_id = $1 
      ORDER BY flagged_at DESC 
      LIMIT 1
    `, [userId]);

    // Get historical trend (last 30 days)
    const { rows: historyRows } = await query(`
      SELECT final_score, flagged_at 
      FROM anomalies 
      WHERE user_id = $1 AND flagged_at >= NOW() - INTERVAL '30 days'
      ORDER BY flagged_at ASC
    `, [userId]);

    const currentRisk = latestRows.length > 0 ? latestRows[0] : { final_score: 0, risk_level: 'Low', reasons: [] };

    res.json({
      userId,
      currentRisk,
      history: historyRows
    });
  } catch (error) {
    console.error('Error fetching risk profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/risk/anomalies (Global)
 * Admin/Manager view: list all system anomalies with filtering and pagination
 */
router.get('/data/anomalies', requireAuth, requireManager, async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, riskLevel } = req.query;
    const offset = (page - 1) * limit;

    let queryStr = `
      SELECT a.*, u.email, u.role
      FROM anomalies a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (userId) {
      queryStr += ` AND a.user_id = $${paramIndex++}`;
      queryParams.push(userId);
    }

    if (riskLevel) {
      // We didn't store 'risk_level' directly in anomalies table in Phase 1 schema,
      // so we filter by final_score ranges
      if (riskLevel.toLowerCase() === 'high') {
        queryStr += ` AND a.final_score > 70`;
      } else if (riskLevel.toLowerCase() === 'medium') {
        queryStr += ` AND a.final_score > 30 AND a.final_score <= 70`;
      } else if (riskLevel.toLowerCase() === 'low') {
        queryStr += ` AND a.final_score <= 30`;
      }
    }

    // Count total for pagination
    const countQuery = `SELECT COUNT(*) FROM (${queryStr}) AS filtered_anomalies`;
    const { rows: countRows } = await query(countQuery, queryParams);
    const total = parseInt(countRows[0].count);

    // Apply ordering and pagination
    queryStr += ` ORDER BY a.flagged_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
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
    console.error('Error fetching anomalies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
