/**
 * FRANKY TECH — Review Service
 * -----------------------------------------------------------
 */
const reviewModel = require('../models/review.model');
const invoiceModel = require('../models/invoice.model');
const customerModel = require('../models/customer.model');
const notificationService = require('./notification.service');
const { generateRawToken } = require('../utils/token');
const { AppError } = require('../middleware/errorHandler');

async function requestReview(businessId, { customerId, invoiceId }) {
  const customer = await customerModel.findById(businessId, customerId);
  if (!customer) throw new AppError('Customer not found.', 404);
  const token = generateRawToken();
  return reviewModel.createRequest({ businessId, customerId, invoiceId, token });
}

async function getRequestByToken(token) {
  const request = await reviewModel.findRequestByToken(token);
  if (!request) throw new AppError('This review link is invalid or has expired.', 404);
  return request;
}

/** Public submission — no auth. A review tied to a real, paid invoice is marked verified. */
async function submitPublicReview(token, { rating, comment }) {
  const request = await getRequestByToken(token);
  if (request.submitted_at) throw new AppError('This review has already been submitted.', 422);
  if (!rating || rating < 1 || rating > 5) throw new AppError('Rating must be between 1 and 5.', 422, { rating: 'Required, 1-5.' });

  let isVerified = false;
  if (request.invoice_id) {
    const invoice = await invoiceModel.findById(request.business_id, request.invoice_id);
    isVerified = !!invoice && invoice.status === 'paid';
  }

  const review = await reviewModel.create({
    businessId: request.business_id,
    customerId: request.customer_id,
    invoiceId: request.invoice_id,
    rating,
    comment,
    reviewerName: request.customer_name,
    isVerified,
  });
  await reviewModel.markRequestSubmitted(request.id);

  await notificationService.notify(request.business_id, {
    type: 'review_received',
    title: 'New review received',
    message: `${request.customer_name} left a ${rating}-star review.`,
    link: '/reviews.html',
  });

  return review;
}

async function listForBusiness(businessId, query) {
  return reviewModel.listForBusiness(businessId, query);
}

async function publicSummaryAndList(businessId) {
  const [summary, reviews] = await Promise.all([
    reviewModel.summary(businessId),
    reviewModel.publicListForBusiness(businessId),
  ]);
  return { summary, reviews };
}

async function moderate(businessId, id, status) {
  const allowed = ['approved', 'hidden', 'flagged'];
  if (!allowed.includes(status)) throw new AppError('Invalid moderation status.', 422);
  const review = await reviewModel.findById(businessId, id);
  if (!review) throw new AppError('Review not found.', 404);
  return reviewModel.updateStatus(businessId, id, status);
}

async function respond(businessId, id, response) {
  if (!response || String(response).trim().length === 0) throw new AppError('A response message is required.', 422);
  const review = await reviewModel.findById(businessId, id);
  if (!review) throw new AppError('Review not found.', 404);
  return reviewModel.respond(businessId, id, response);
}

async function report(businessId, id, reason, details) {
  const review = await reviewModel.findById(businessId, id);
  if (!review) throw new AppError('Review not found.', 404);
  return reviewModel.reportReview(id, reason, details);
}

module.exports = { requestReview, getRequestByToken, submitPublicReview, listForBusiness, publicSummaryAndList, moderate, respond, report };
