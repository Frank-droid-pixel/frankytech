const shareService = require('../services/share.service');
const pdfService = require('../services/pdf.service');

async function createLink(req, res, next) {
  try {
    const share = await shareService.getOrCreateShareLink(req.business.id, req.params.docType, req.params.docId, req.business.invoice_prefix);
    res.status(201).json({ share, url: `${process.env.APP_URL || ''}/portal.html?token=${share.token}` });
  } catch (err) { next(err); }
}

async function revoke(req, res, next) {
  try { await shareService.revoke(req.business.id, req.params.id); res.json({ success: true }); }
  catch (err) { next(err); }
}

// --- Public (no auth) ---
async function publicGet(req, res, next) {
  try { res.json(await shareService.resolvePublicShare(req.params.token)); }
  catch (err) { next(err); }
}

async function publicPdf(req, res, next) {
  try {
    const { docType, doc } = await shareService.resolvePublicShare(req.params.token);
    const businessModel = require('../models/business.model');
    const business = await businessModel.findById(doc.business_id);
    if (docType === 'invoice') pdfService.streamInvoicePdf(res, doc, business);
    else if (docType === 'quotation') pdfService.streamQuotationPdf(res, doc, business);
    else pdfService.streamReceiptPdf(res, doc, business);
  } catch (err) { next(err); }
}

module.exports = { createLink, revoke, publicGet, publicPdf };
