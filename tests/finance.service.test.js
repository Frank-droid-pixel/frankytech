/**
 * FRANKY TECH — Tests: Financial Calculation Service
 * -----------------------------------------------------------
 * This is the single most important module to test correctly —
 * every invoice, quotation, PDF and report depends on it never
 * drifting on floating-point math. Run with: npm test
 * -----------------------------------------------------------
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateDocumentTotals, deriveInvoiceStatus, toCents, fromCents } = require('../server/services/finance.service');

test('toCents/fromCents round-trip without drift', () => {
  assert.equal(toCents(19.99), 1999);
  assert.equal(fromCents(1999), 19.99);
  assert.equal(toCents(0.1) + toCents(0.2), 30); // classic float trap, must NOT be 29.999...
});

test('calculateDocumentTotals: single line, no discount/tax', () => {
  const result = calculateDocumentTotals([{ quantity: 2, unitPrice: 10, taxRate: 0 }], {});
  assert.equal(result.subtotal, 20);
  assert.equal(result.taxAmount, 0);
  assert.equal(result.total, 20);
});

test('calculateDocumentTotals: tax applied per line', () => {
  const result = calculateDocumentTotals([{ quantity: 1, unitPrice: 100, taxRate: 15 }], {});
  assert.equal(result.subtotal, 100);
  assert.equal(result.taxAmount, 15);
  assert.equal(result.total, 115);
});

test('calculateDocumentTotals: fixed discount applied after subtotal', () => {
  const result = calculateDocumentTotals(
    [{ quantity: 1, unitPrice: 100, taxRate: 0 }],
    { discountType: 'fixed', discountValue: 20 }
  );
  assert.equal(result.discountAmount, 20);
  assert.equal(result.total, 80);
});

test('calculateDocumentTotals: percent discount computed off subtotal, not total', () => {
  const result = calculateDocumentTotals(
    [{ quantity: 1, unitPrice: 200, taxRate: 10 }],
    { discountType: 'percent', discountValue: 10 }
  );
  // subtotal 200, discount 10% of 200 = 20, tax 10% of 200 = 20 -> total 200-20+20 = 200
  assert.equal(result.discountAmount, 20);
  assert.equal(result.taxAmount, 20);
  assert.equal(result.total, 200);
});

test('calculateDocumentTotals: shipping and labour add to total, never taxed themselves', () => {
  const result = calculateDocumentTotals(
    [{ quantity: 1, unitPrice: 100, taxRate: 0 }],
    { shippingAmount: 15, labourAmount: 25 }
  );
  assert.equal(result.total, 140);
});

test('calculateDocumentTotals: total never goes negative even with an oversized discount', () => {
  const result = calculateDocumentTotals(
    [{ quantity: 1, unitPrice: 50, taxRate: 0 }],
    { discountType: 'fixed', discountValue: 500 }
  );
  assert.equal(result.total, 0);
});

test('calculateDocumentTotals: balance due reflects amount already paid', () => {
  const result = calculateDocumentTotals(
    [{ quantity: 1, unitPrice: 100, taxRate: 0 }],
    { paidAmount: 40 }
  );
  assert.equal(result.paidAmount, 40);
  assert.equal(result.balanceAmount, 60);
});

test('calculateDocumentTotals: multi-line invoice sums correctly', () => {
  const result = calculateDocumentTotals(
    [
      { quantity: 3, unitPrice: 25.5, taxRate: 0 },
      { quantity: 1, unitPrice: 10, taxRate: 20 },
    ],
    {}
  );
  // line 1: 76.5, line 2: 10 + 2 tax = 12
  assert.equal(result.subtotal, 86.5);
  assert.equal(result.taxAmount, 2);
  assert.equal(result.total, 88.5);
});

test('deriveInvoiceStatus: fully paid -> paid', () => {
  const status = deriveInvoiceStatus({ total: 100, paidAmount: 100, balanceAmount: 0 }, 'sent', null);
  assert.equal(status, 'paid');
});

test('deriveInvoiceStatus: partial payment -> partially_paid', () => {
  const status = deriveInvoiceStatus({ total: 100, paidAmount: 40, balanceAmount: 60 }, 'sent', null);
  assert.equal(status, 'partially_paid');
});

test('deriveInvoiceStatus: past due date with balance owing -> overdue', () => {
  const status = deriveInvoiceStatus({ total: 100, paidAmount: 0, balanceAmount: 100 }, 'sent', '2020-01-01');
  assert.equal(status, 'overdue');
});

test('deriveInvoiceStatus: cancelled invoices never change status', () => {
  const status = deriveInvoiceStatus({ total: 100, paidAmount: 100, balanceAmount: 0 }, 'cancelled', null);
  assert.equal(status, 'cancelled');
});
