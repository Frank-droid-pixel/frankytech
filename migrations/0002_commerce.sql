-- =========================================================
-- FRANKY TECH — Migration 0002: Commerce
-- Covers Phases 6-14: customers, products/services, invoices,
-- quotations, receipts, payments, expenses, inventory.
--
-- Design note: "products" and "services" from the master spec
-- are unified into one `items` table with a `type` column
-- (product | service). They share almost every field (name,
-- price, tax, description); a product additionally tracks
-- stock. This avoids duplicating the same CRUD/validation/PDF
-- logic twice for no real benefit. Documented here so it's a
-- visible, deliberate simplification rather than a shortcut.
-- =========================================================

-- ---------------------------------------------------------
-- customers
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  company     TEXT,
  phone       TEXT,
  email       TEXT,
  address     TEXT,
  country     TEXT,
  tax_id      TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers (business_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers (business_id, name);

-- ---------------------------------------------------------
-- items (products + services, see note above)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type             TEXT NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'service')),
  name             TEXT NOT NULL,
  sku              TEXT,
  category         TEXT,
  description      TEXT,
  cost             NUMERIC(14,2) NOT NULL DEFAULT 0,
  price            NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate         NUMERIC(5,2) NOT NULL DEFAULT 0,
  unit             TEXT DEFAULT 'unit',
  quantity         NUMERIC(14,2) NOT NULL DEFAULT 0,
  min_stock        NUMERIC(14,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_items_business_id ON items (business_id);
CREATE INDEX IF NOT EXISTS idx_items_type ON items (business_id, type);
CREATE INDEX IF NOT EXISTS idx_items_sku ON items (business_id, sku);

-- ---------------------------------------------------------
-- inventory_transactions
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  item_id        UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'adjustment', 'return')),
  quantity       NUMERIC(14,2) NOT NULL,
  reference_type TEXT,
  reference_id   UUID,
  note           TEXT,
  created_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_business_id ON inventory_transactions (business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_item_id ON inventory_transactions (item_id);

-- ---------------------------------------------------------
-- document_sequences (per-business, per-document-type numbering)
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_sequences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('invoice', 'quotation', 'receipt')),
  prefix       TEXT NOT NULL DEFAULT '',
  next_number  INTEGER NOT NULL DEFAULT 1,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, doc_type)
);

-- ---------------------------------------------------------
-- invoices + invoice_items
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  invoice_number   TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  currency         TEXT NOT NULL DEFAULT 'USD',
  issue_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date         DATE,
  subtotal         NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_type    TEXT DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percent')),
  discount_value   NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  shipping_amount  NUMERIC(14,2) NOT NULL DEFAULT 0,
  labour_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  total            NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_amount      NUMERIC(14,2) NOT NULL DEFAULT 0,
  balance_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  terms            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, invoice_number)
);
CREATE INDEX IF NOT EXISTS idx_invoices_business_id ON invoices (business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (business_id, status);

CREATE TABLE IF NOT EXISTS invoice_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id      UUID REFERENCES items(id) ON DELETE SET NULL,
  description  TEXT NOT NULL,
  quantity     NUMERIC(14,2) NOT NULL DEFAULT 1,
  unit_price   NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate     NUMERIC(5,2) NOT NULL DEFAULT 0,
  line_total   NUMERIC(14,2) NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);

-- ---------------------------------------------------------
-- quotations + quotation_items
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  quotation_number    TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted')),
  currency            TEXT NOT NULL DEFAULT 'USD',
  issue_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until         DATE,
  subtotal            NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_type       TEXT DEFAULT 'fixed' CHECK (discount_type IN ('fixed', 'percent')),
  discount_value      NUMERIC(14,2) NOT NULL DEFAULT 0,
  discount_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  shipping_amount     NUMERIC(14,2) NOT NULL DEFAULT 0,
  labour_amount       NUMERIC(14,2) NOT NULL DEFAULT 0,
  total               NUMERIC(14,2) NOT NULL DEFAULT 0,
  notes               TEXT,
  terms               TEXT,
  converted_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, quotation_number)
);
CREATE INDEX IF NOT EXISTS idx_quotations_business_id ON quotations (business_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations (business_id, status);

CREATE TABLE IF NOT EXISTS quotation_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id  UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  item_id       UUID REFERENCES items(id) ON DELETE SET NULL,
  description   TEXT NOT NULL,
  quantity      NUMERIC(14,2) NOT NULL DEFAULT 1,
  unit_price    NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate      NUMERIC(5,2) NOT NULL DEFAULT 0,
  line_total    NUMERIC(14,2) NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items (quotation_id);

-- ---------------------------------------------------------
-- payments + receipts
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount      NUMERIC(14,2) NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'USD',
  method      TEXT NOT NULL DEFAULT 'cash'
              CHECK (method IN ('cash', 'bank_transfer', 'mobile_money', 'card', 'online', 'other')),
  reference   TEXT,
  status      TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),
  paid_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments (business_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments (invoice_id);

CREATE TABLE IF NOT EXISTS receipts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  payment_id     UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id     UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  customer_id    UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  receipt_number TEXT NOT NULL,
  amount         NUMERIC(14,2) NOT NULL,
  balance_after  NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, receipt_number)
);
CREATE INDEX IF NOT EXISTS idx_receipts_business_id ON receipts (business_id);

-- ---------------------------------------------------------
-- expenses
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category        TEXT NOT NULL,
  description     TEXT,
  amount          NUMERIC(14,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method  TEXT DEFAULT 'cash',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses (business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (business_id, expense_date);
