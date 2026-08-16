const reviewService = require('../services/review.service');
const audit = require('../utils/audit');

async function requestReview(req, res, next) {
  try { res.status(201).json({ request: await reviewService.requestReview(req.business.id, req.body) }); }
  catch (err) { next(err); }
}

async function list(req, res, next) {
  try { res.json({ reviews: await reviewService.listForBusiness(req.business.id, req.query) }); }
  catch (err) { next(err); }
}

async function moderate(req, res, next) {
  try {
    const review = await reviewService.moderate(req.business.id, req.params.id, req.body.status);
    audit.log({ userId: req.session.user.id, businessId: req.business.id, action: 'review.moderate', resource: 'reviews', metadata: { reviewId: req.params.id, status: req.body.status }, ipAddress: req.ip });
    res.json({ review });
  }
  catch (err) { next(err); }
}

async function respond(req, res, next) {
  try { res.json({ review: await reviewService.respond(req.business.id, req.params.id, req.body.response) }); }
  catch (err) { next(err); }
}

// --- Public (no auth) ---
async function publicGetRequest(req, res, next) {
  try { res.json({ request: await reviewService.getRequestByToken(req.params.token) }); }
  catch (err) { next(err); }
}

async function publicSubmit(req, res, next) {
  try { res.status(201).json({ review: await reviewService.submitPublicReview(req.params.token, req.body) }); }
  catch (err) { next(err); }
}

async function publicBusinessReviews(req, res, next) {
  try { res.json(await reviewService.publicSummaryAndList(req.params.businessId)); }
  catch (err) { next(err); }
}

module.exports = { requestReview, list, moderate, respond, publicGetRequest, publicSubmit, publicBusinessReviews };
