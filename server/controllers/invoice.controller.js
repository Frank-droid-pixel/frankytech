const invoiceService = require('../services/invoice.service');
const pdfService = require('../services/pdf.service');
const audit = require('../utils/audit');

async function list(req, res, next) {
  try {
    const { status, customerId, limit, offset } = req.query;
    const result = await invoiceService.listInvoices(req.business.id, { status, customerId, limit: Number(limit) || 50, offset: Number(offset) || 0 });
    res.json(result);
  } catch (err) { next(err); }
}

async function get(req, res, next) {
  try { res.json({ invoice: await invoiceService.getInvoice(req.business.id, req.params.id) }); }
  catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const invoice = await invoiceService.createInvoice(req.business.id, req.body, req.session.user.id, req.business.invoice_prefix);
    audit.log({ userId: req.session.user.id, businessId: req.business.id, action: 'invoice.create', resource: 'invoices', metadata: { invoiceId: invoice.id, total: invoice.total }, ipAddress: req.ip });
    res.status(201).json({ invoice });
  } catch (err) { next(err); }
}

async function markSent(req, res, next) {
  try { res.json({ invoice: await invoiceService.markSent(req.business.id, req.params.id) }); }
  catch (err) { next(err); }
}

async function cancel(req, res, next) {
  try {
    const invoice = await invoiceService.cancelInvoice(req.business.id, req.params.id);
    audit.log({ userId: req.session.user.id, businessId: req.business.id, action: 'invoice.cancel', resource: 'invoices', metadata: { invoiceId: req.params.id }, ipAddress: req.ip });
    res.json({ invoice });
  }
  catch (err) { next(err); }
}

async function pdf(req, res, next) {
  try {
    const invoice = await invoiceService.getInvoice(req.business.id, req.params.id);
    pdfService.streamInvoicePdf(res, invoice, req.business);
  } catch (err) { next(err); }
}

module.exports = { list, get, create, markSent, cancel, pdf };
