/**
 * FRANKY TECH — Document Share Service (Customer Portal, Phase 16/95)
 * -----------------------------------------------------------
 */
const shareModel = require('../models/documentShare.model');
const invoiceModel = require('../models/invoice.model');
const quotationModel = require('../models/quotation.model');
const paymentModel = require('../models/payment.model');
const { generateRawToken } = require('../utils/token');
const { AppError } = require('../middleware/errorHandler');

const FETCHERS = {
  invoice: (businessId, id) => invoiceModel.findById(businessId, id),
  quotation: (businessId, id) => quotationModel.findById(businessId, id),
  receipt: (businessId, id) => paymentModel.findReceiptById(businessId, id),
};

async function getOrCreateShareLink(businessId, docType, docId, businessInvoicePrefix) {
  if (!FETCHERS[docType]) throw new AppError('Invalid document type.', 422);
  const doc = await FETCHERS[docType](businessId, docId);
  if (!doc) throw new AppError('Document not found.', 404);

  const existing = await shareModel.findExistingActive(businessId, docType, docId);
  if (existing) return existing;

  const token = generateRawToken();
  return shareModel.create({ businessId, docType, docId, token, expiresAt: null });
}

async function resolvePublicShare(token) {
  const share = await shareModel.findValidByToken(token);
  if (!share) throw new AppError('This link is invalid, has been revoked, or has expired.', 404);

  const fetcher = FETCHERS[share.doc_type];
  const doc = await fetcher(share.business_id, share.doc_id);
  if (!doc) throw new AppError('Document not found.', 404);

  shareModel.incrementViewCount(share.id).catch(() => {});
  return { docType: share.doc_type, doc };
}

async function revoke(businessId, shareId) {
  return shareModel.revoke(businessId, shareId);
}

module.exports = { getOrCreateShareLink, resolvePublicShare, revoke };
