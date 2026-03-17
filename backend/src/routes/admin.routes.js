const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');
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

module.exports = router;
