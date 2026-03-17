const { query } = require('../db/db');

/**
 * Runs the database cleanup to delete stale standard activity logs.
 * We keep anomalies forever, but standard benign logs rot after 90 days.
 */
const runCleanup = async () => {
  try {
    const { rowCount } = await query(`
      DELETE FROM activity_logs 
      WHERE timestamp < NOW() - INTERVAL '90 days'
        AND id NOT IN (
          SELECT log_id FROM anomalies WHERE log_id IS NOT NULL
        )
    `);

    console.log(`🧹 Cleanup Job: Deleted ${rowCount || 0} old activity logs.`);
  } catch (error) {
    console.error('🧹 Cleanup Job Error:', error);
  }
};

module.exports = { runCleanup };
