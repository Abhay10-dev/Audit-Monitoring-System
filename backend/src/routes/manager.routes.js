const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireManager } = require('../middlewares/rbac.middleware');
const { query } = require('../db/db');

/**
 * GET /api/manager/employees
 * Returns a list of all employees (for the manager to manage).
 * Accessible by: admin, manager
 */
router.get('/employees', requireAuth, requireManager, async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, email, display_name, role, is_blocked, is_active, created_at
       FROM users
       WHERE role = 'employee'
       ORDER BY created_at DESC`
    );
    res.json({ data: rows });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/manager/employees/:id/block
 * Toggles the is_blocked status of an employee.
 * Managers can only block employees (not other managers/admins).
 * Body: { blocked: true | false }
 */
router.patch('/employees/:id/block', requireAuth, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;

    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ error: '`blocked` must be a boolean' });
    }

    // Safety: ensure the target user is an employee (managers cannot block admins/other managers)
    const { rows: targetRows } = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [id]
    );

    if (targetRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetRows[0].role !== 'employee') {
      return res.status(403).json({ error: 'Managers can only block employees' });
    }

    const { rows } = await query(
      `UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_blocked`,
      [blocked, id]
    );

    res.json({
      message: blocked ? 'User blocked successfully' : 'User unblocked successfully',
      user: rows[0],
    });
  } catch (error) {
    console.error('Error toggling block status:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
