/**
 * FRANKY TECH — Quotation Service
 * -----------------------------------------------------------
 */

const quotationModel = require('../models/quotation.model');
const customerModel = require('../models/customer.model');
const sequenceModel = require('../models/documentSequence.model');
const invoiceService = require('./invoice.service');
const { calculateDocumentTotals } = require('./finance.service');
const { AppError } = require('../middleware/errorHandler');

async function createQuotation(businessId, body, invoicePrefix) {
  if (!body.customerId) throw new AppError('A customer is required.', 422, { customerId: 'Required.' });
  const customer = await customerModel.findById(businessId, body.customerId);
  if (!customer) throw new AppError('Customer not found for this business.', 422);

  const lines = await invoiceService.resolveLines(businessId, body.items);
  const totals = calculateDocumentTotals(lines, {
    discountType: body.discountType || 'fixed',
    discountValue: Number(body.discountValue) || 0,
    shippingAmount: Number(body.shippingAmount) || 0,
    labourAmount: Number(body.labourAmount) || 0,
  });
  totals.discountType = body.discountType || 'fixed';
  totals.discountValue = Number(body.discountValue) || 0;

  const quotationNumber = await sequenceModel.generate(businessId, 'quotation', `QUO-${invoicePrefix || 'INV'}`);

  return quotationModel.createWithItems({
    businessId,
    customerId: body.customerId,
    quotationNumber,
    currency: body.currency || customer.currency || 'USD',
    issueDate: body.issueDate || new Date().toISOString().slice(0, 10),
    validUntil: body.validUntil || null,
    totals,
    notes: body.notes,
    terms: body.terms,
  });
}

async function getQuotation(businessId, id) {
  const quotation = await quotationModel.findById(businessId, id);
  if (!quotation) throw new AppError('Quotation not found.', 404);
  return quotation;
}

async function listQuotations(businessId, query) {
  const [items, total] = await Promise.all([
    quotationModel.list(businessId, query),
    quotationModel.count(businessId),
  ]);
  return { items, total };
}

async function updateStatus(businessId, id, status) {
  const allowed = ['draft', 'sent', 'accepted', 'rejected', 'expired'];
  if (!allowed.includes(status)) throw new AppError('Invalid quotation status.', 422);
  const quotation = await getQuotation(businessId, id);
  if (quotation.status === 'converted') throw new AppError('A converted quotation cannot change status.', 422);
  return quotationModel.updateStatus(businessId, id, status);
}

/** Converts an accepted quotation into a real invoice, reusing the same line items and totals. */
async function convertToInvoice(businessId, id, userId, invoicePrefix) {
  const quotation = await getQuotation(businessId, id);
  if (quotation.status === 'converted') throw new AppError('This quotation has already been converted.', 422);

  const invoice = await invoiceService.createInvoice(
    businessId,
    {
      customerId: quotation.customer_id,
      currency: quotation.currency,
      discountType: quotation.discount_type,
      discountValue: quotation.discount_value,
      shippingAmount: quotation.shipping_amount,
      labourAmount: quotation.labour_amount,
      notes: quotation.notes,
      terms: quotation.terms,
      items: quotation.items.map((l) => ({
        itemId: l.item_id,
        description: l.description,
        quantity: Number(l.quantity),
        unitPrice: Number(l.unit_price),
        taxRate: Number(l.tax_rate),
      })),
    },
    userId,
    invoicePrefix
  );

  await quotationModel.updateStatus(businessId, id, 'converted', invoice.id);
  return invoice;
}

module.exports = { createQuotation, getQuotation, listQuotations, updateStatus, convertToInvoice };
