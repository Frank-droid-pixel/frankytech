/**
 * FRANKY TECH — Automation Engine
 * -----------------------------------------------------------
 * Phase 21. Configurable-in-spirit workflow triggers. Each
 * function here is called from the natural place the
 * underlying event already happens (payment recorded, invoice
 * overdue, stock low) rather than a separate polling job,
 * except for the two checks that have no single trigger point
 * (overdue detection, low stock) which run on every dashboard
 * load — cheap, idempotent (deduped for 24h), and always fresh.
 * -----------------------------------------------------------
 */
const invoiceModel = require('../models/invoice.model');
const itemModel = require('../models/item.model');
const notificationService = require('./notification.service');

/** Trigger: invoice becomes overdue -> notification. */
async function checkOverdueInvoices(businessId) {
  const overdueCount = await invoiceModel.markOverdueInvoices(businessId);
  if (overdueCount > 0) {
    await notificationService.notify(businessId, {
      type: 'invoice_overdue',
      title: `${overdueCount} invoice${overdueCount > 1 ? 's' : ''} overdue`,
      message: 'One or more invoices just passed their due date with a balance still owing.',
      link: '/invoices.html',
      dedupeHours: 24,
    });
  }
  return overdueCount;
}

/** Trigger: stock becomes low -> notification. */
async function checkLowStock(businessId) {
  const lowStockItems = await itemModel.lowStock(businessId);
  if (lowStockItems.length > 0) {
    await notificationService.notify(businessId, {
      type: 'low_stock',
      title: `${lowStockItems.length} product${lowStockItems.length > 1 ? 's' : ''} running low`,
      message: lowStockItems.slice(0, 5).map((i) => i.name).join(', '),
      link: '/products.html',
      dedupeHours: 24,
    });
  }
  return lowStockItems;
}

/** Trigger: payment received -> notification (receipt itself is created transactionally in payment.model). */
async function onPaymentReceived(businessId, { customerName, amount, currency, invoiceNumber }) {
  return notificationService.notify(businessId, {
    type: 'payment_received',
    title: 'Payment received',
    message: `${customerName} paid ${currency} ${amount} on invoice ${invoiceNumber}.`,
    link: '/invoices.html',
  });
}

/** Run the polling-style checks together — called once per dashboard load. */
async function runBusinessChecks(businessId) {
  const [overdue, lowStock] = await Promise.all([checkOverdueInvoices(businessId), checkLowStock(businessId)]);
  return { overdue, lowStockCount: lowStock.length };
}

module.exports = { checkOverdueInvoices, checkLowStock, onPaymentReceived, runBusinessChecks };
