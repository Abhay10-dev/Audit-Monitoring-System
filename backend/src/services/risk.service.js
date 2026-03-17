const { query } = require('../db/db');

/**
 * Combine rule engine and ML model scores into a final weighted risk score (0-100).
 * 
 * @param {number} ruleScore - Raw score from the deterministic rule engine
 * @param {number} mlScore - Normalized 0.0 to 1.0 anomaly score from the ML model
 * @param {string[]} ruleReasons - Array of reasons flagged by the rule engine
 * @returns {Object} { finalScore, riskLevel, reasons }
 */
const calculateRisk = (ruleScore, mlScore, ruleReasons = []) => {
  // We weight rule score by 0.4, and the ML score (which is 0-1) is scaled to 100 and weighted by 0.6
  // We cap the maximum score at 100.
  const rawFinal = (ruleScore * 0.4) + (mlScore * 100 * 0.6);
  const finalScore = Math.min(100, Math.round(rawFinal));

  let riskLevel = 'Low';
  if (finalScore > 30 && finalScore <= 70) riskLevel = 'Medium';
  if (finalScore > 70) riskLevel = 'High';

  // Construct explainability output
  const reasons = [...ruleReasons];
  if (mlScore >= 0.5) {
    reasons.push(`High ML anomaly score (${Math.round(mlScore * 100)}%)`);
  } else if (mlScore >= 0.3) {
    reasons.push(`Moderate ML anomaly score (${Math.round(mlScore * 100)}%)`);
  }

  return { finalScore, riskLevel, reasons };
};

/**
 * Persist an anomalous event to the anomalies table.
 */
const storeAnomaly = async ({ userId, ruleScore, mlScore, finalScore, reasons }) => {
  const { rows } = await query(
    `INSERT INTO anomalies (user_id, rule_score, ml_score, final_score, reasons)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, ruleScore, mlScore, finalScore, JSON.stringify(reasons)]
  );
  return rows[0];
};

module.exports = { calculateRisk, storeAnomaly };
