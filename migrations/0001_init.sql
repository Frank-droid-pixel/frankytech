-- =========================================================
-- FRANKY TECH — Migration 0001: Foundation schema
-- Covers: users, sessions, password resets, email verification,
-- businesses, business membership.
-- Later phases add: customers, products, invoices, payments, etc.
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------
-- users
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name          TEXT NOT NULL,
  email              TEXT NOT NULL UNIQUE,
  phone              TEXT,
  country            TEXT,
  password_hash      TEXT NOT NULL,
  referral_code      TEXT UNIQUE,
  referred_by        UUID REFERENCES users(id) ON DELETE SET NULL,
  email_verified_at  TIMESTAMPTZ,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users (referral_code);

-- ---------------------------------------------------------
-- sessions (HTTP-only cookie auth)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash          TEXT NOT NULL UNIQUE,
  current_business_id UUID,
  user_agent          TEXT,
  ip_address          TEXT,
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions (token_hash);

-- ---------------------------------------------------------
-- password_resets
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_resets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets (user_id);

-- ---------------------------------------------------------
-- email_verifications
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_verifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications (user_id);

-- ---------------------------------------------------------
-- businesses
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                     TEXT NOT NULL,
  slug                     TEXT NOT NULL UNIQUE,
  business_type            TEXT,
  logo_url                 TEXT,
  description              TEXT,
  address                  TEXT,
  phone                    TEXT,
  email                    TEXT,
  website                  TEXT,
  country                  TEXT,
  currency                 TEXT NOT NULL DEFAULT 'USD',
  tax_id                   TEXT,
  tax_rate                 NUMERIC(5,2) NOT NULL DEFAULT 0,
  invoice_prefix           TEXT NOT NULL DEFAULT 'INV',
  invoice_terms            TEXT,
  invoice_footer           TEXT,
  onboarding_completed_at  TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON businesses (owner_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses (slug);

-- ---------------------------------------------------------
-- business_members (roles: owner, admin, manager, accountant, sales, staff)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS business_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'owner'
               CHECK (role IN ('owner', 'admin', 'manager', 'accountant', 'sales', 'staff')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_business_members_business_id ON business_members (business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user_id ON business_members (user_id);

-- ---------------------------------------------------------
-- audit_logs (minimal foundation — expanded in later phases)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  resource    TEXT,
  metadata    JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs (business_id);
