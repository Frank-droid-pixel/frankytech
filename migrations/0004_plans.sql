-- =========================================================
-- FRANKY TECH — Migration 0004: Default Subscription Plans
-- Seeds the four plans previewed on the landing page so
-- Phase 18 has real, database-driven rows to read from.
-- Admins can edit price/features/limits later — nothing about
-- pricing is hard-coded in application code.
-- =========================================================

INSERT INTO subscription_plans (code, name, price, currency, billing_interval, features, limits, sort_order)
VALUES
  ('free', 'Free', 0, 'USD', 'free',
   '["1 business", "20 invoices / month", "Basic reports", "Community support"]',
   '{"businesses": 1, "invoicesPerMonth": 20, "teamMembers": 1}', 1),
  ('starter', 'Starter', 9, 'USD', 'monthly',
   '["1 business", "Unlimited invoices", "Inventory tracking", "Email support"]',
   '{"businesses": 1, "invoicesPerMonth": null, "teamMembers": 2}', 2),
  ('business', 'Business', 29, 'USD', 'monthly',
   '["Up to 3 businesses", "Team members", "Recurring invoices", "Priority support"]',
   '{"businesses": 3, "invoicesPerMonth": null, "teamMembers": 10}', 3),
  ('pro', 'Pro', 79, 'USD', 'monthly',
   '["Unlimited businesses", "Advanced analytics", "API access", "Dedicated support"]',
   '{"businesses": null, "invoicesPerMonth": null, "teamMembers": null}', 4)
ON CONFLICT (code) DO NOTHING;
