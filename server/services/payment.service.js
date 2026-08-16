/**
 * FRANKY TECH — Payment Service
 * -----------------------------------------------------------
 */

const paymentModel = require('../models/payment.model');
const invoiceModel = require('../models/invoice.model');
const automationService = require('./automation.service');
const { AppError } = require('../middleware/errorHandler');

const ALLOWED_METHODS = ['cash', 'bank_transfer', 'mobile_money', 'card', 'online', 'other'];

async function recordPayment(businessId, invoiceId, body, invoicePrefix) {
  const invoice = await invoiceModel.findById(businessId, invoiceId);
  if (!invoice) throw new AppError('Invoice not found.', 404);
  if (invoice.status === 'cancelled') throw new AppError('Cannot record a payment on a cancelled invoice.', 422);

  const amount = Number(body.amount);
  if (!amount || amount <= 0) throw new AppError('Payment amount must be greater than zero.', 422, { amount: 'Required, must be > 0.' });
  if (amount > Number(invoice.balance_amount) + 0.01) {
    throw new AppError(`Payment exceeds the outstanding balance of ${invoice.balance_amount}.`, 422, { amount: 'Exceeds balance due.' });
  }

  const method = ALLOWED_METHODS.includes(body.method) ? body.method : 'cash';

  // NOTE: "online" payments must be verified server-side against the
  // payment gateway's webhook before being trusted — that verification
  // step is implemented in Phase 19 (Payment gateway architecture). Until
  // then, online payments are accepted as manually-confirmed entries only,
  // same as cash/bank transfer.
  const result = await paymentModel.recordPaymentAndReceipt({
    businessId,
    invoiceId,
    amount,
    currency: invoice.currency,
    method,
    reference: body.reference,
    notes: body.notes,
    invoicePrefix,
  });

  // Automation trigger (Phase 21): payment received -> notification.
  // Best-effort — a notification failure should never roll back a
  // payment that already succeeded.
  automationService
    .onPaymentReceived(businessId, {
      customerName: invoice.customer_name,
      amount,
      currency: invoice.currency,
      invoiceNumber: invoice.invoice_number,
    })
    .catch(() => {});

  return result;
}

async function listForInvoice(businessId, invoiceId) {
  return paymentModel.listForInvoice(businessId, invoiceId);
}

async function listReceipts(businessId, query) {
  return paymentModel.listReceipts(businessId, query);
}

async function getReceipt(businessId, id) {
  const receipt = await paymentModel.findReceiptById(businessId, id);
  if (!receipt) throw new AppError('Receipt not found.', 404);
  return receipt;
}

module.exports = { recordPayment, listForInvoice, listReceipts, getReceipt };
