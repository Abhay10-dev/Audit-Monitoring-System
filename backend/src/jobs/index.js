const cron = require('node-cron');
const cleanupJob = require('./cleanup.job');
const reportJob = require('./report.job');
const mlRetrainJob = require('./ml-retrain.job');

/**
 * Initialize all background cron jobs
 */
const initJobs = () => {
  console.log('⏳ Initializing background cron jobs...');

  // 1. Log Cleanup Job (Runs every day at Midnight)
  // '0 0 * * *'
  cron.schedule('0 0 * * *', () => {
    console.log('⏰ Running daily activity log cleanup job...');
    cleanupJob.runCleanup();
  });

  // 2. Daily System Report Job (Runs every day at 8:00 AM)
  // '0 8 * * *'
  cron.schedule('0 8 * * *', () => {
    console.log('⏰ Running daily system report job...');
    reportJob.runDailyReport();
  });

  // 3. ML Model Retraining Trigger Check (Runs every Sunday at Midnight)
  // '0 0 * * 0'
  cron.schedule('0 0 * * 0', () => {
    console.log('⏰ Running weekly ML retraining trigger check...');
    mlRetrainJob.checkFeedbackLevel();
  });
  
  console.log('✅ Cron jobs scheduled successfully.');
};

module.exports = { initJobs };
