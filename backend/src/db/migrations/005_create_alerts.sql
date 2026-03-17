-- Migration: 005_create_alerts.sql
-- Stores generated alerts triggered by high risk scores

CREATE TABLE IF NOT EXISTS alerts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anomaly_id    UUID REFERENCES anomalies(id) ON DELETE SET NULL,
  risk_level    VARCHAR(10) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
  final_score   NUMERIC(5,2),
  message       TEXT NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'false_positive')),
  email_sent    BOOLEAN DEFAULT FALSE,
  resolved_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_risk_level ON alerts(risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
