/**
 * FRANKY TECH — Centralized Financial Calculation Service
 * -----------------------------------------------------------
 * The ONE place that computes subtotal, discount, tax, shipping,
 * labour, total and balance. Invoices, quotations, receipts,
 * PDFs and reports all call this — never re-implement totals
 * anywhere else, and never trust a total sent by the browser.
 *
 * All money math happens in integer minor units (cents) to
 * avoid floating-point drift, then converted back to decimal
 * for storage/display.
 * -----------------------------------------------------------
 */

function toCents(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function fromCents(cents) {
  return Math.round(cents) / 100;
}

/**
 * @param {Array<{quantity:number, unitPrice:number, taxRate:number}>} lines
 * @param {Object} options
 * @param {'fixed'|'percent'} options.discountType
 * @param {number} options.discountValue
 * @param {number} options.shippingAmount
 * @param {number} options.labourAmount
 * @param {number} options.paidAmount — only relevant for invoices
 */
function calculateDocumentTotals(lines, options = {}) {
  const {
    discountType = 'fixed',
    discountValue = 0,
    shippingAmount = 0,
    labourAmount = 0,
    paidAmount = 0,
  } = options;

  let subtotalCents = 0;
  let taxCents = 0;

  const computedLines = (lines || []).map((line) => {
    const qty = Number(line.quantity) || 0;
    const unitPriceCents = toCents(line.unitPrice);
    const lineSubtotalCents = Math.round(qty * unitPriceCents);
    const lineTaxCents = Math.round((lineSubtotalCents * (Number(line.taxRate) || 0)) / 100);
    subtotalCents += lineSubtotalCents;
    taxCents += lineTaxCents;
    return {
      ...line,
      lineTotal: fromCents(lineSubtotalCents + lineTaxCents),
    };
  });

  const discountCents =
    discountType === 'percent'
      ? Math.round((subtotalCents * (Number(discountValue) || 0)) / 100)
      : toCents(discountValue);

  const shippingCents = toCents(shippingAmount);
  const labourCents = toCents(labourAmount);
  const paidCents = toCents(paidAmount);

  const totalCents = Math.max(0, subtotalCents - discountCents + taxCents + shippingCents + labourCents);
  const balanceCents = Math.max(0, totalCents - paidCents);

  return {
    lines: computedLines,
    subtotal: fromCents(subtotalCents),
    discountAmount: fromCents(discountCents),
    taxAmount: fromCents(taxCents),
    shippingAmount: fromCents(shippingCents),
    labourAmount: fromCents(labourCents),
    total: fromCents(totalCents),
    paidAmount: fromCents(paidCents),
    balanceAmount: fromCents(balanceCents),
  };
}

/** Derives the correct invoice status from amounts — never set status by hand from the client. */
function deriveInvoiceStatus(totals, currentStatus, dueDate) {
  if (currentStatus === 'cancelled') return 'cancelled';
  if (totals.balanceAmount <= 0 && totals.total > 0) return 'paid';
  if (totals.paidAmount > 0 && totals.balanceAmount > 0) return 'partially_paid';
  if (dueDate && new Date(dueDate) < new Date() && totals.balanceAmount > 0) return 'overdue';
  if (currentStatus === 'draft') return 'draft';
  return currentStatus === 'viewed' ? 'viewed' : 'sent';
}

module.exports = { toCents, fromCents, calculateDocumentTotals, deriveInvoiceStatus };
