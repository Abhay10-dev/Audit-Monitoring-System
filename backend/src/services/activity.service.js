const { query } = require('../db/db');
const { evaluateRules } = require('./ruleEngine.service');
const { callMLService, buildMLPayload } = require('./ml.service');
const { calculateRisk, storeAnomaly } = require('./risk.service');
const { generateAlert } = require('./alerts.service');

/**
 * Reusable function to log an activity event
 */
const logActivity = async ({ userId, sessionId, activityType, description, ipAddress, deviceInfo, metadata = {} }) => {
  try {
    const { rows } = await query(
      `INSERT INTO activity_logs 
       (user_id, session_id, activity_type, description, ip_address, device_info, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, sessionId || null, activityType, description, ipAddress, deviceInfo, metadata]
    );

    const logEntry = rows[0];
    
    // ── Async evaluation pipeline (non-blocking) ───────────────────────
    // Run rule engine + ML service in parallel, then combine results.
    // Neither blocks the API response; failures are handled gracefully.
    const runEvaluationPipeline = async () => {
      // 1. Static rule evaluation (always available)
      const { ruleScore, reasons } = await evaluateRules(logEntry);

      // 2. ML anomaly scoring (with automatic fallback to 0 on failure)
      const mlPayload = buildMLPayload(logEntry, {
        failed_attempts: metadata.failed_attempts || 0,
        is_new_device: metadata.is_new_device || false,
        is_new_ip: metadata.is_new_ip || false,
        session_duration: metadata.session_duration || 0,
      });
      const mlResult = await callMLService(mlPayload);
      const mlScore = mlResult ? mlResult.anomaly_score : 0; // 0 = assume normal if ML fails

      // 3. Combined risk score mapping
      const { finalScore, riskLevel, reasons: combinedReasons } = calculateRisk(ruleScore, mlScore, reasons);

      if (finalScore > 0) {
        console.log(`⚠️  Risk detected [User ${userId}]: ruleScore=${ruleScore}, mlScore=${mlScore.toFixed(2)}, finalScore=${finalScore} (${riskLevel} Risk)`);
        
        // Store in anomalies table for historical tracking/analytics
        const anomaly = await storeAnomaly({
          userId,
          ruleScore,
          mlScore,
          finalScore,
          reasons: combinedReasons
        });

        // 4. Trigger Alerts if Risk is High
        if (finalScore > 70) {
          // Fetch user email to include in the alert
          const userRows = await query(`SELECT email FROM users WHERE id = $1`, [userId]);
          const email = userRows.rows[0]?.email || 'Unknown User';
          await generateAlert(anomaly, email);
        }
      }
    };

    runEvaluationPipeline().catch((err) => {
      console.error('Evaluation pipeline error:', err.message);
    });

    return logEntry;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - we don't want to break the main request flow if a log fails
    return null;
  }
};

module.exports = { logActivity };
