/**
 * FRANKY TECH — Dashboard Routes  (/api/dashboard)
 * -----------------------------------------------------------
 * Now backed by real data from Customers, Products, Invoices,
 * Expenses and Inventory (Phases 6-14). Reviews and Referrals
 * numbers stay at zero with the correct shape until their
 * owning phases are implemented.
 * -----------------------------------------------------------
 */

const express = require('express');
const router = express.Router();

const { requireAuth, requireBusiness } = require('../middleware/auth.middleware');
const invoiceModel = require('../models/invoice.model');
const customerModel = require('../models/customer.model');
const itemModel = require('../models/item.model');
const reportModel = require('../models/report.model');
const expenseModel = require('../models/expense.model');
const quotationModel = require('../models/quotation.model');
const reviewModel = require('../models/review.model');
const automationService = require('../services/automation.service');

router.use(requireAuth, requireBusiness);

router.get('/summary', async (req, res, next) => {
  try {
    const businessId = req.business.id;
    const today = new Date().toISOString().slice(0, 10);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    // Automation triggers (Phase 21): overdue invoices + low stock,
    // run fresh on every dashboard load.
    await automationService.runBusinessChecks(businessId);

    const [
      todaySales, monthSales, monthExpenses, customerCount, productCount,
      lowStockItems, pendingQuotations, outstandingInvoices, overdueInvoices,
      reviewSummary,
    ] = await Promise.all([
      reportModel.salesTotals(businessId, today, today),
      reportModel.salesTotals(businessId, monthStart, today),
      expenseModel.totalForPeriod(businessId, monthStart, today),
      customerModel.count(businessId),
      itemModel.count(businessId, 'product'),
      itemModel.lowStock(businessId),
      quotationModel.count(businessId),
      invoiceModel.count(businessId, 'sent'),
      invoiceModel.count(businessId, 'overdue'),
      reviewModel.summary(businessId),
    ]);

    res.json({
      business: {
        id: req.business.id,
        name: req.business.name,
        currency: req.business.currency,
        onboardingCompleted: !!req.business.onboarding_completed_at,
      },
      role: req.businessRole,
      stats: {
        todaySales: todaySales.revenue,
        monthlySales: monthSales.revenue,
        expenses: monthExpenses,
        profit: monthSales.revenue - monthExpenses,
        outstandingInvoices,
        overdueInvoices,
        customers: customerCount,
        products: productCount,
        inventoryAlerts: lowStockItems.length,
        pendingQuotations,
        recentPayments: [],
        recentReviews: { averageRating: reviewSummary.average, totalReviews: reviewSummary.total },
        referralPerformance: { clicks: 0, registrations: 0 }, // per-user, not per-business — see referrals.html
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
