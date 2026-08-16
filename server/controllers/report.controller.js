const reportService = require('../services/report.service');

async function profitAndLoss(req, res, next) {
  try { res.json(await reportService.profitAndLoss(req.business.id, req.query)); }
  catch (err) { next(err); }
}

async function sales(req, res, next) {
  try { res.json(await reportService.salesReport(req.business.id, req.query)); }
  catch (err) { next(err); }
}

async function customers(req, res, next) {
  try { res.json(await reportService.customersReport(req.business.id, req.query)); }
  catch (err) { next(err); }
}

async function invoices(req, res, next) {
  try { res.json(await reportService.invoicesReport(req.business.id)); }
  catch (err) { next(err); }
}

module.exports = { profitAndLoss, sales, customers, invoices };
