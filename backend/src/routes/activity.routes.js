const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/rbac.middleware');
const { requireRole } = require('../middlewares/rbac.middleware');
const { logActivity } = require('../services/activity.service');
const { query } = require('../db/db');

/**
 * POST /api/activity/log
 */
router.post('/log', requireAuth, async (req, res) => {
  try {
    const { activityType, description, metadata, sessionId, ipAddress, deviceInfo } = req.body;

    if (!activityType || !description) {
      return res.status(400).json({ error: 'activityType and description are required' });
    }

    const logEntry = await logActivity({
      userId: req.user.id,
      sessionId,
      activityType,
      description,
      ipAddress: ipAddress || req.ip,
      deviceInfo: deviceInfo || req.headers['user-agent'],
      metadata
    });

    res.status(201).json({ message: 'Activity logged', log: logEntry });
  } catch (error) {
    console.error('Error in POST /api/activity/log:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/activity/user/:id
 */
router.get('/user/:id', requireAuth, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { page = 1, limit = 20, activityType } = req.query;

    if (req.user.role === 'employee' && req.user.id !== targetUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own activity logs' });
    }

    const offset = (page - 1) * limit;
    const queryParams = [targetUserId, limit, offset];
    
    let sql = `
      SELECT id, activity_type, description, ip_address, device_info, metadata, timestamp 
      FROM activity_logs 
      WHERE user_id = $1
    `;

    if (activityType) {
      sql += ` AND activity_type = $4`;
      queryParams.push(activityType);
    }

    sql += ` ORDER BY timestamp DESC LIMIT $2 OFFSET $3`;

    const { rows } = await query(sql, queryParams);
    
    let countSql = `SELECT COUNT(*) FROM activity_logs WHERE user_id = $1`;
    const countParams = [targetUserId];
    if (activityType) {
      countSql += ` AND activity_type = $2`;
      countParams.push(activityType);
    }
    const countResult = await query(countSql, countParams);

    res.json({
      data: rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/activity
 */
router.get('/', requireAuth, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { page = 1, limit = 50, activityType, userId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    let sql = `
      SELECT a.id, a.activity_type, a.description, a.ip_address, a.device_info, a.timestamp,
             u.email, u.display_name, u.role
      FROM activity_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (activityType) {
      sql += ` AND a.activity_type = $${paramIndex++}`;
      queryParams.push(activityType);
    }
    if (userId) {
      sql += ` AND a.user_id = $${paramIndex++}`;
      queryParams.push(userId);
    }
    if (startDate) {
      sql += ` AND a.timestamp >= $${paramIndex++}`;
      queryParams.push(startDate);
    }
    if (endDate) {
      sql += ` AND a.timestamp <= $${paramIndex++}`;
      queryParams.push(endDate);
    }

    sql += ` ORDER BY a.timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    const { rows } = await query(sql, queryParams);

    let countSql = `SELECT COUNT(*) FROM activity_logs a WHERE 1=1`;
    const countParams = [];
    let countIndex = 1;

    if (activityType) { countSql += ` AND a.activity_type = $${countIndex++}`; countParams.push(activityType); }
    if (userId) { countSql += ` AND a.user_id = $${countIndex++}`; countParams.push(userId); }
    if (startDate) { countSql += ` AND a.timestamp >= $${countIndex++}`; countParams.push(startDate); }
    if (endDate) { countSql += ` AND a.timestamp <= $${countIndex++}`; countParams.push(endDate); }

    const countResult = await query(countSql, countParams);

    res.json({
      data: rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching global activity logs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
