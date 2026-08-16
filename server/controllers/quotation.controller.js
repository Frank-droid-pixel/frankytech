const quotationService = require('../services/quotation.service');
const pdfService = require('../services/pdf.service');

async function list(req, res, next) {
  try {
    const { status, limit, offset } = req.query;
    const result = await quotationService.listQuotations(req.business.id, { status, limit: Number(limit) || 50, offset: Number(offset) || 0 });
    res.json(result);
  } catch (err) { next(err); }
}

async function get(req, res, next) {
  try { res.json({ quotation: await quotationService.getQuotation(req.business.id, req.params.id) }); }
  catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const quotation = await quotationService.createQuotation(req.business.id, req.body, req.business.invoice_prefix);
    res.status(201).json({ quotation });
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try { res.json({ quotation: await quotationService.updateStatus(req.business.id, req.params.id, req.body.status) }); }
  catch (err) { next(err); }
}

async function convert(req, res, next) {
  try {
    const invoice = await quotationService.convertToInvoice(req.business.id, req.params.id, req.session.user.id, req.business.invoice_prefix);
    res.status(201).json({ invoice });
  } catch (err) { next(err); }
}

async function pdf(req, res, next) {
  try {
    const quotation = await quotationService.getQuotation(req.business.id, req.params.id);
    pdfService.streamQuotationPdf(res, quotation, req.business);
  } catch (err) { next(err); }
}

module.exports = { list, get, create, updateStatus, convert, pdf };
