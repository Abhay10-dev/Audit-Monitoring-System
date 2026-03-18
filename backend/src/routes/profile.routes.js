const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { query } = require('../db/db');

/**
 * GET /api/profile
 * Returns the authenticated user's own profile data + recent activity.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // If user doesn't exist in DB yet (first login in progress), return minimal info
    if (!userId) {
      return res.json({ user: { email: req.user.email }, recentActivity: [] });
    }

    // Fetch full profile
    const { rows: userRows } = await query(
      `SELECT id, email, display_name, role, is_active, is_blocked, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch last 10 activity logs
    const { rows: activityRows } = await query(
      `SELECT activity_type, description, ip_address, timestamp
       FROM activity_logs
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 10`,
      [userId]
    );

    res.json({ user: userRows[0], recentActivity: activityRows });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/profile
 * Update own display name.
 */
router.patch('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { displayName } = req.body;

    if (!displayName || typeof displayName !== 'string') {
      return res.status(400).json({ error: 'displayName is required' });
    }

    const { rows } = await query(
      `UPDATE users SET display_name = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, email, display_name, role`,
      [displayName.trim(), userId]
    );

    res.json({ message: 'Profile updated', user: rows[0] });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
