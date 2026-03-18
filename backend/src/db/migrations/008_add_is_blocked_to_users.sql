-- Migration: 008_add_is_blocked_to_users.sql
-- Adds a is_blocked flag to users for admin/manager enforcement

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast blocked-user queries
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);
