-- Migration: 004_create_anomalies.sql
-- Stores detected anomalies with rule scores, ML scores, and final risk scores

CREATE TABLE IF NOT EXISTS anomalies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES sessions(id) ON DELETE SET NULL,
  rule_score    NUMERIC(5,2) NOT NULL DEFAULT 0,   -- 0–100
  ml_score      NUMERIC(5,4) NOT NULL DEFAULT 0,   -- 0.0–1.0 from Isolation Forest
  final_score   NUMERIC(5,2) NOT NULL DEFAULT 0,   -- (rule*0.4) + (ml*100*0.6)
  risk_level    VARCHAR(10) NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  reasons       JSONB NOT NULL DEFAULT '[]',        -- e.g. ["Late login (+20)", "New device (+30)"]
  triggered_rules JSONB DEFAULT '[]',
  flagged_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_anomalies_user_id ON anomalies(user_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_risk_level ON anomalies(risk_level);
CREATE INDEX IF NOT EXISTS idx_anomalies_final_score ON anomalies(final_score DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_flagged_at ON anomalies(flagged_at);
