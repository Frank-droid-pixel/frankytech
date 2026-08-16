-- =========================================================
-- FRANKY TECH — Migration 0005: Admin & Platform Operations
-- Covers Phase 24 (Admin Dashboard) and rounds out Phase 48/49
-- (platform reviews / feedback) referenced by the spec but not
-- yet built in earlier phases.
-- =========================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------
-- platform_feedback (Phase 48/49 — feedback about FRANKY TECH itself)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('feature_request', 'bug_report', 'complaint', 'suggestion', 'general')),
  rating      SMALLINT CHECK (rating BETWEEN 1 AND 5),
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'planned', 'in_progress', 'completed', 'rejected')),
  is_public   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_feedback_status ON platform_feedback (status);

-- ---------------------------------------------------------
-- platform_announcements (admin-configurable, Phase 66)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
