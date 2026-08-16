const paymentService = require('../services/payment.service');
const pdfService = require('../services/pdf.service');
const audit = require('../utils/audit');

async function recordPayment(req, res, next) {
  try {
    const result = await paymentService.recordPayment(req.business.id, req.params.invoiceId, req.body, req.business.invoice_prefix);
    audit.log({ userId: req.session.user.id, businessId: req.business.id, action: 'payment.record', resource: 'payments', metadata: { invoiceId: req.params.invoiceId, amount: result.payment.amount }, ipAddress: req.ip });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function listForInvoice(req, res, next) {
  try { res.json({ payments: await paymentService.listForInvoice(req.business.id, req.params.invoiceId) }); }
  catch (err) { next(err); }
}

async function listReceipts(req, res, next) {
  try {
    const { limit, offset } = req.query;
    res.json({ receipts: await paymentService.listReceipts(req.business.id, { limit: Number(limit) || 50, offset: Number(offset) || 0 }) });
  } catch (err) { next(err); }
}

async function getReceipt(req, res, next) {
  try { res.json({ receipt: await paymentService.getReceipt(req.business.id, req.params.id) }); }
  catch (err) { next(err); }
}

async function receiptPdf(req, res, next) {
  try {
    const receipt = await paymentService.getReceipt(req.business.id, req.params.id);
    pdfService.streamReceiptPdf(res, receipt, req.business);
  } catch (err) { next(err); }
}

module.exports = { recordPayment, listForInvoice, listReceipts, getReceipt, receiptPdf };
