const { query } = require('../db/db');

// In-memory cache for rules to avoid DB hits on every single activity log
let rulesCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

/**
 * Loads rules from the DB and caches them
 */
const getActiveRules = async () => {
  const now = Date.now();
  if (rulesCache && (now - lastCacheUpdate < CACHE_TTL_MS)) {
    return rulesCache;
  }

  const { rows } = await query('SELECT * FROM rules_config WHERE is_active = true');
  
  // Transform array into an accessible object map: { 'off_hours_login': { threshold, weight }, ... }
  rulesCache = rows.reduce((acc, rule) => {
    acc[rule.rule_name] = {
      threshold: rule.threshold,
      weight: rule.weight
    };
    return acc;
  }, {});
  
  lastCacheUpdate = now;
  return rulesCache;
};

/**
 * Forces a refresh of the rule cache (useful when admin updates rules)
 */
const invalidateRulesCache = () => {
  rulesCache = null;
};

/**
 * Evaluates an incoming activity log against configured rules
 * Returns { ruleScore: number, reasons: string[] }
 */
const evaluateRules = async (activityLog) => {
  let ruleScore = 0;
  let reasons = [];
  
  try {
    const rules = await getActiveRules();
    const { user_id, activity_type, timestamp, ip_address, device_info } = activityLog;

    // ── Rule 1: Off-Hours Login ──────────────────────────────────────
    if (activity_type === 'login' && rules['off_hours_login']) {
      const activityDate = new Date(timestamp);
      const hour = activityDate.getHours();
      
      // Simple 08:00 - 18:00 check (threshold could be used dynamically later)
      if (hour < 8 || hour > 18) {
        ruleScore += rules['off_hours_login'].weight;
        reasons.push(`Login outside working hours (${hour}:00)`);
      }
    }

    // ── Rule 2: Multiple Failed Logins ───────────────────────────────
    if (activity_type === 'failed_login' && rules['multiple_failed_logins']) {
      const { threshold, weight } = rules['multiple_failed_logins'];
      
      // Check last 15 minutes for failed attempts
      const { rows } = await query(`
        SELECT COUNT(*) FROM activity_logs 
        WHERE user_id = $1 
          AND activity_type = 'failed_login' 
          AND timestamp > NOW() - INTERVAL '15 minutes'
      `, [user_id]);

      const failedCount = parseInt(rows[0].count);
      // If we *just* crossed the threshold, flag it
      if (failedCount >= threshold) {
        ruleScore += weight;
        reasons.push(`Multiple failed logins (${failedCount} in 15m)`);
      }
    }

    // ── Rule 3: Unrecognized Device ──────────────────────────────────
    if (activity_type === 'login' && rules['unrecognized_device'] && device_info) {
      const { weight } = rules['unrecognized_device'];
      
      const { rows } = await query(`
        SELECT COUNT(*) FROM activity_logs
        WHERE user_id = $1 AND activity_type = 'login' AND device_info = $2
      `, [user_id, device_info]);

      // If this is the FIRST time we see this device (count is 1 because the current log was just inserted)
      if (parseInt(rows[0].count) <= 1) {
        ruleScore += weight;
        reasons.push('Login from new/unrecognized device');
      }
    }

    // ── Rule 4: Unrecognized IP Location ─────────────────────────────
    if (activity_type === 'login' && rules['unrecognized_ip'] && ip_address) {
      const { weight } = rules['unrecognized_ip'];
      
      const { rows } = await query(`
        SELECT COUNT(*) FROM activity_logs
        WHERE user_id = $1 AND activity_type = 'login' AND ip_address = $2
      `, [user_id, ip_address]);

      if (parseInt(rows[0].count) <= 1) {
        ruleScore += weight;
        reasons.push(`Login from new IP address (${ip_address})`);
      }
    }

    return { ruleScore, reasons };

  } catch (error) {
    console.error('Error in evaluateRules:', error);
    // Fail open: don't block the system, return 0 risk
    return { ruleScore: 0, reasons: [] };
  }
};

module.exports = {
  evaluateRules,
  invalidateRulesCache,
  getActiveRules
};
