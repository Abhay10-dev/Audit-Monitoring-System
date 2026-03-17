/**
 * ml.service.js — Node.js client that calls the ML microservice.
 * Handles retries and provides graceful fallback on failure.
 */
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS = 3000; // 3s max — don't stall the pipeline
const MAX_RETRIES = 2;

/**
 * Call the ML service /predict endpoint with activity features.
 *
 * @param {Object} features - Activity event features matching Python schema
 * @returns {Promise<{ anomaly_score: number, is_anomaly: boolean }|null>}
 *   Returns null if service is unreachable (caller handles fallback).
 */
const callMLService = async (features, retries = 0) => {
  try {
    const { data } = await axios.post(`${ML_SERVICE_URL}/predict`, features, {
      timeout: ML_TIMEOUT_MS,
      headers: { 'Content-Type': 'application/json' }
    });
    return data;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      console.warn(`ML service call failed, retry ${retries + 1}/${MAX_RETRIES}...`);
      return callMLService(features, retries + 1);
    }
    // All retries exhausted — log and fail open
    console.error(`ML service unavailable after ${MAX_RETRIES} retries:`, error.message);
    return null;
  }
};

/**
 * Build the feature payload from an activity log row.
 * Called by activity.service.js after a log entry is stored.
 *
 * @param {Object} activityLog - Row from activity_logs table
 * @param {Object} context - Extra flags (is_new_device, is_new_ip, failed_attempts)
 */
const buildMLPayload = (activityLog, context = {}) => {
  const ts = new Date(activityLog.timestamp);
  const loginHour = ts.getHours();
  const dayOfWeek = ts.getDay(); // 0 = Sunday, 6 = Saturday

  return {
    user_id: activityLog.user_id,
    login_hour: loginHour,
    session_duration: context.session_duration || 0,
    failed_attempts: context.failed_attempts || 0,
    is_new_device: Boolean(context.is_new_device),
    is_new_ip: Boolean(context.is_new_ip),
    is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
    is_off_hours: loginHour < 8 || loginHour > 18,
  };
};

module.exports = { callMLService, buildMLPayload };
