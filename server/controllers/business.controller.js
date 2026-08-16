/**
 * FRANKY TECH — Business Controller
 * -----------------------------------------------------------
 */

const businessService = require('../services/business.service');
const { validateBusinessCreate } = require('../validators/business.validator');
const { AppError } = require('../middleware/errorHandler');

async function create(req, res, next) {
  try {
    const { valid, errors } = validateBusinessCreate(req.body);
    if (!valid) throw new AppError('Please correct the highlighted fields.', 422, errors);

    const business = await businessService.createBusiness(
      req.session.user.id,
      req.body,
      req.session.sessionId
    );
    res.status(201).json({ business });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const businesses = await businessService.listMyBusinesses(req.session.user.id);
    res.json({ businesses });
  } catch (err) {
    next(err);
  }
}

async function updateOnboarding(req, res, next) {
  try {
    const business = await businessService.updateOnboarding(
      req.params.id,
      req.session.user.id,
      req.body
    );
    res.json({ business });
  } catch (err) {
    next(err);
  }
}

async function select(req, res, next) {
  try {
    await businessService.selectBusiness(req.params.id, req.session.user.id, req.session.sessionId);
    res.json({ success: true, currentBusinessId: req.params.id });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, updateOnboarding, select };
