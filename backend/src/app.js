const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth.routes');
const activityRoutes = require('./routes/activity.routes');
const riskRoutes = require('./routes/risk.routes');
const alertsRoutes = require('./routes/alerts.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const { captureApiActivity } = require('./middlewares/activity.middleware');
const { apiLimiter } = require('./middlewares/rateLimiter.middleware');

const app = express();

// ── Security & Middleware ─────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Apply global rate limiting
app.use(apiLimiter);

// ── Health Check ──────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────

app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/activity',  require('./routes/activity.routes'));

// Auto-capture authenticated API interactions for these core modules
app.use('/api/risk', captureApiActivity('api_call', 'Risk module interaction'), require('./routes/risk.routes'));
app.use('/api/alerts', captureApiActivity('api_call', 'Alerts module interaction'), require('./routes/alerts.routes'));
app.use('/api/admin', captureApiActivity('api_call', 'Admin module interaction'), require('./routes/admin.routes'));
app.use('/api/analytics', captureApiActivity('api_call', 'Analytics view interaction'), require('./routes/analytics.routes'));

// ── 404 Fallback ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
