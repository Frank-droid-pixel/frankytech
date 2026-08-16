/**
 * FRANKY TECH — Business Service
 * -----------------------------------------------------------
 */

const businessModel = require('../models/business.model');
const sessionModel = require('../models/session.model');
const referralService = require('./referral.service');
const { slugify } = require('../utils/slug');
const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

async function createBusiness(userId, { name, businessType, country, currency }, sessionId) {
  const slug = await slugify(pool, name);
  const business = await businessModel.create({
    ownerId: userId,
    name: name.trim(),
    slug,
    businessType,
    country,
    currency,
  });
  await businessModel.addMember({ businessId: business.id, userId, role: 'owner' });

  // Automation trigger (Phase 21) + referral qualification (Phase 17):
  // creating your first business is the "qualifying" event for whoever
  // referred you. Best-effort — never blocks business creation.
  referralService.qualifyReferral(userId).catch(() => {});

  // A newly created business becomes the session's active business,
  // so the dashboard the user lands on next is already scoped correctly.
  if (sessionId) await sessionModel.setCurrentBusiness(sessionId, business.id);

  return business;
}

async function listMyBusinesses(userId) {
  return businessModel.listForUser(userId);
}

/**
 * Verifies the requesting user actually belongs to the business
 * before returning it. Never trust a businessId sent by the browser
 * without this check — this is the data-isolation boundary.
 */
async function getOwnedBusinessOrThrow(businessId, userId) {
  if (!businessId) throw new AppError('A businessId is required.', 400);
  const membership = await businessModel.getMembership(businessId, userId);
  if (!membership) throw new AppError('Business not found or access denied.', 403);
  const business = await businessModel.findById(businessId);
  if (!business) throw new AppError('Business not found.', 404);
  return { business, role: membership.role };
}

async function updateOnboarding(businessId, userId, fields) {
  await getOwnedBusinessOrThrow(businessId, userId);
  const updated = await businessModel.updateProfile(businessId, fields);
  return businessModel.markOnboardingComplete(updated.id);
}

async function selectBusiness(businessId, userId, sessionId) {
  await getOwnedBusinessOrThrow(businessId, userId);
  await sessionModel.setCurrentBusiness(sessionId, businessId);
}

module.exports = {
  createBusiness,
  listMyBusinesses,
  getOwnedBusinessOrThrow,
  updateOnboarding,
  selectBusiness,
};
