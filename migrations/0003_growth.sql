-- =========================================================
-- FRANKY TECH — Migration 0003: Growth & Operations
-- Covers Phases 15-23: reviews, customer portal (via secure
-- share links), referrals, subscriptions, payment gateway
-- webhook logging, notifications, team invitations, support.
--
-- Design note (Customer Portal, Phase 16 / Document Sharing,
-- Phase 95): rather than a separate customer login system,
-- customers access their invoices/quotations/receipts through
-- a secure, revocable, expiring share link (document_shares).
-- This satisfies "customers can securely view their own
-- documents without seeing anyone else's" without building a
-- second parallel authentication system. Documented here as a
-- deliberate simplification, not an oversight.
-- =========================================================

-- ---------------------------------------------------------
-- reviews
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id          UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id          UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_id           UUID REFERENCES invoices(id) ON DELETE SET NULL,
  rating               SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment              TEXT,
  reviewer_name        TEXT NOT NULL,
  is_verified          BOOLEAN NOT NULL DEFAULT false,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden', 'flagged')),
  business_response    TEXT,
  business_response_at TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews (business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (business_id, status);

CREATE TABLE IF NOT EXISTS review_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invoice_id   UUID REFERENCES invoices(id) ON DELETE SET NULL,
  token        TEXT NOT NULL UNIQUE,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_review_requests_business_id ON review_requests (business_id);

CREATE TABLE IF NOT EXISTS review_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  details     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- document_shares (secure customer portal links)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_shares (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  doc_type    TEXT NOT NULL CHECK (doc_type IN ('invoice', 'quotation', 'receipt')),
  doc_id      UUID NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ,
  revoked_at  TIMESTAMPTZ,
  view_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares (token);
CREATE INDEX IF NOT EXISTS idx_document_shares_doc ON document_shares (doc_type, doc_id);

-- ---------------------------------------------------------
-- referrals
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS referral_clicks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code  TEXT NOT NULL,
  ip_address     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks (referral_code);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'qualified', 'approved', 'paid', 'rejected')),
  amount             NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency           TEXT NOT NULL DEFAULT 'USD',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)
);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards (referrer_user_id);

-- ---------------------------------------------------------
-- subscriptions (Phase 18 — plans are database-driven, per spec §53)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code              TEXT NOT NULL UNIQUE,
  name              TEXT NOT NULL,
  price             NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'USD',
  billing_interval  TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly', 'free')),
  features          JSONB NOT NULL DEFAULT '[]',
  limits            JSONB NOT NULL DEFAULT '{}',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id             UUID NOT NULL REFERENCES subscription_plans(id),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id)
);

-- ---------------------------------------------------------
-- payment_webhook_events (Phase 19 — gateway architecture)
-- Every inbound webhook call is logged BEFORE being trusted,
-- so a bad/forged signature is provable and payments are
-- never marked confirmed without passing verification.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider         TEXT NOT NULL DEFAULT 'generic',
  signature_valid  BOOLEAN NOT NULL DEFAULT false,
  payload          JSONB,
  processed_at     TIMESTAMPTZ,
  error            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- notifications (Phase 20)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  link        TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_business_id ON notifications (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications (business_id, is_read);

-- ---------------------------------------------------------
-- team_invitations (Phase 22)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS team_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'accountant', 'sales', 'staff')),
  token       TEXT NOT NULL UNIQUE,
  invited_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days')
);
CREATE INDEX IF NOT EXISTS idx_team_invitations_business_id ON team_invitations (business_id);

-- ---------------------------------------------------------
-- support (Phase 23)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  subject     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority    TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_business_id ON support_tickets (business_id);

CREATE TABLE IF NOT EXISTS support_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  sender_type     TEXT NOT NULL DEFAULT 'user' CHECK (sender_type IN ('user', 'support')),
  message         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages (ticket_id);
