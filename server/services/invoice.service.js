/**
 * FRANKY TECH — Invoice Service
 * -----------------------------------------------------------
 * Validates and prices a submitted invoice server-side using
 * the centralized finance engine. Line prices/tax are read
 * from the database for any line tied to a catalog item —
 * the client can send a quantity, never a trusted price.
 * -----------------------------------------------------------
 */

const invoiceModel = require('../models/invoice.model');
const customerModel = require('../models/customer.model');
const itemModel = require('../models/item.model');
const sequenceModel = require('../models/documentSequence.model');
const { calculateDocumentTotals } = require('./finance.service');
const { AppError } = require('../middleware/errorHandler');

async function resolveLines(businessId, rawLines) {
  if (!Array.isArray(rawLines) || rawLines.length === 0) {
    throw new AppError('At least one line item is required.', 422);
  }

  const resolved = [];
  for (const raw of rawLines) {
    const quantity = Number(raw.quantity) || 0;
    if (quantity <= 0) throw new AppError('Every line must have a quantity greater than zero.', 422);

    if (raw.itemId) {
      const item = await itemModel.findById(businessId, raw.itemId);
      if (!item) throw new AppError(`Item not found: ${raw.itemId}`, 422);
      if (item.type === 'product' && Number(item.quantity) < quantity) {
        throw new AppError(`Not enough stock for "${item.name}" (available: ${item.quantity}).`, 422);
      }
      resolved.push({
        itemId: item.id,
        description: raw.description || item.name,
        quantity,
        unitPrice: Number(item.price), // server-trusted price, never the client's
        taxRate: Number(item.tax_rate),
      });
    } else {
      // Custom / one-off line (e.g. labour note) — still requires an explicit price
      // set by the business user in this request, never inferred from elsewhere.
      if (!raw.description || Number(raw.unitPrice) < 0) {
        throw new AppError('Custom line items require a description and a non-negative price.', 422);
      }
      resolved.push({
        itemId: null,
        description: raw.description,
        quantity,
        unitPrice: Number(raw.unitPrice) || 0,
        taxRate: Number(raw.taxRate) || 0,
      });
    }
  }
  return resolved;
}

async function createInvoice(businessId, body, userId, invoicePrefix) {
  if (!body.customerId) throw new AppError('A customer is required.', 422, { customerId: 'Required.' });
  const customer = await customerModel.findById(businessId, body.customerId);
  if (!customer) throw new AppError('Customer not found for this business.', 422);

  const lines = await resolveLines(businessId, body.items);

  const totals = calculateDocumentTotals(lines, {
    discountType: body.discountType || 'fixed',
    discountValue: Number(body.discountValue) || 0,
    shippingAmount: Number(body.shippingAmount) || 0,
    labourAmount: Number(body.labourAmount) || 0,
    paidAmount: 0,
  });
  totals.discountType = body.discountType || 'fixed';
  totals.discountValue = Number(body.discountValue) || 0;

  const invoiceNumber = await sequenceModel.generate(businessId, 'invoice', invoicePrefix || 'INV');

  return invoiceModel.createWithItems({
    businessId,
    customerId: body.customerId,
    invoiceNumber,
    currency: body.currency || customer.currency || 'USD',
    issueDate: body.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: body.dueDate || null,
    totals,
    notes: body.notes,
    terms: body.terms,
    userId,
  });
}

async function getInvoice(businessId, id) {
  const invoice = await invoiceModel.findById(businessId, id);
  if (!invoice) throw new AppError('Invoice not found.', 404);
  return invoice;
}

async function listInvoices(businessId, query) {
  const [items, total] = await Promise.all([
    invoiceModel.list(businessId, query),
    invoiceModel.count(businessId, query.status),
  ]);
  return { items, total };
}

async function markSent(businessId, id) {
  const invoice = await getInvoice(businessId, id);
  if (invoice.status !== 'draft') return invoice;
  return invoiceModel.updateStatus(businessId, id, 'sent');
}

async function cancelInvoice(businessId, id) {
  const invoice = await getInvoice(businessId, id);
  if (invoice.status === 'paid') throw new AppError('A fully paid invoice cannot be cancelled.', 422);
  return invoiceModel.updateStatus(businessId, id, 'cancelled');
}

module.exports = { createInvoice, getInvoice, listInvoices, markSent, cancelInvoice, resolveLines };
