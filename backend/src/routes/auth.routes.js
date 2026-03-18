const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { query } = require('../db/db');
const { loginLimiter } = require('../middlewares/rateLimiter.middleware');

/**
 * POST /api/auth/login
 * Verifies Firebase token (via middleware), upserts user in DB, 
 * and delegates session logging to the Activity service.
 */
router.post('/login', loginLimiter, requireAuth, async (req, res) => {
  try {
    const { firebase_uid, email } = req.user;
    const { displayName, ipAddress, location, deviceInfo, browser } = req.body;

    // 1. Check if user exists in DB
    let userQuery = await query('SELECT * FROM users WHERE firebase_uid = $1', [firebase_uid]);
    let user = userQuery.rows[0];

    // 2. If not, create them
    if (!user) {
      // Check if this is the first user in the system
      const countResult = await query('SELECT COUNT(*) FROM users');
      const isFirstUser = parseInt(countResult.rows[0].count) === 0;
      const initialRole = isFirstUser ? 'admin' : 'employee';

      const insertQuery = await query(
        `INSERT INTO users (firebase_uid, email, display_name, role) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [firebase_uid, email, displayName || null, initialRole]
      );
      user = insertQuery.rows[0];
    }

    // 3. Create a new active session
    const sessionQuery = await query(
      `INSERT INTO sessions (user_id, ip_address, location, device_info, browser, is_active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING id as session_id`,
      [user.id, ipAddress, location, deviceInfo, browser]
    );
    const sessionId = sessionQuery.rows[0].session_id;

    // 4. Log the "login" activity
    await query(
      `INSERT INTO activity_logs (user_id, session_id, activity_type, description, ip_address, device_info)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, sessionId, 'login', 'User logged into the system', ipAddress, deviceInfo]
    );

    // TODO: Trigger Rule Engine evaluation async here (Phase 4)

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name
      },
      sessionId
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Failed to process login' });
  }
});

/**
 * POST /api/auth/logout
 * Marks the session as inactive and records the logout time
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required to logout' });
    }

    // 1. Close session
    await query(
      `UPDATE sessions 
       SET is_active = false, logout_time = NOW(), 
           duration_secs = EXTRACT(EPOCH FROM (NOW() - login_time))
       WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    // 2. Log logout activity
    await query(
      `INSERT INTO activity_logs (user_id, session_id, activity_type, description)
       VALUES ($1, $2, $3, $4)`,
      [userId, sessionId, 'logout', 'User logged out']
    );

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ error: 'Failed to process logout' });
  }
});

module.exports = router;
