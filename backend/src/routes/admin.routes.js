const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/rbac.middleware');
const { query } = require('../db/db');
const { invalidateRulesCache } = require('../services/ruleEngine.service');

/**
 * GET /api/admin/rules
 * Fetch all configured rules
 */
router.get('/rules', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM rules_config ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching rules:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/admin/rules
 * Update a specific rule's configuration
 */
router.post('/rules', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id, threshold, weight, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Rule ID is required' });
    }

    const { rows } = await query(
      `UPDATE rules_config 
       SET threshold = COALESCE($1, threshold), 
           weight = COALESCE($2, weight), 
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4 
       RETURNING *`,
      [threshold, weight, is_active, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Rule not found' });
    }

    // Invalidate the rule cache so the next activity log uses the fresh DB state
    invalidateRulesCache();

    res.json({ message: 'Rule updated successfully', rule: rows[0] });
  } catch (error) {
    console.error('Error updating rule:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/admin/users
 * List all users in the system (paginated).
 */
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const { rows } = await query(
      `SELECT id, email, display_name, role, is_active, is_blocked, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );
    const countRes = await query('SELECT COUNT(*) FROM users');
    res.json({ data: rows, total: parseInt(countRes.rows[0].count) });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/admin/users/:id/role
 * Change a user's role. Admin can assign 'employee' or 'manager'.
 * Cannot change another admin's role.
 * Body: { role: 'employee' | 'manager' }
 */
router.patch('/users/:id/role', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['employee', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Role must be employee or manager' });
    }

    // Safety: cannot modify another admin
    const { rows: targetRows } = await query('SELECT role FROM users WHERE id = $1', [id]);
    if (targetRows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (targetRows[0].role === 'admin') {
      return res.status(403).json({ error: 'Cannot change another admin\'s role' });
    }

    const { rows } = await query(
      `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, email, display_name, role`,
      [role, id]
    );
    res.json({ message: 'Role updated successfully', user: rows[0] });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/admin/users/:id/block
 * Toggle is_blocked for any non-admin user.
 * Body: { blocked: true | false }
 */
router.patch('/users/:id/block', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;

    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ error: '`blocked` must be a boolean' });
    }

    const { rows: targetRows } = await query('SELECT role FROM users WHERE id = $1', [id]);
    if (targetRows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (targetRows[0].role === 'admin') {
      return res.status(403).json({ error: 'Cannot block another admin' });
    }

    const { rows } = await query(
      `UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, email, role, is_blocked`,
      [blocked, id]
    );
    res.json({
      message: blocked ? 'User blocked' : 'User unblocked',
      user: rows[0],
    });
  } catch (error) {
    console.error('Error toggling user block:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
