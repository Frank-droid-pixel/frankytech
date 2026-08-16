/**
 * FRANKY TECH — Report Service
 * -----------------------------------------------------------
 * Combines sales + expense data into the Profit & Loss figures
 * from Phase 14/39 of the spec. Every number is a direct
 * database aggregate — nothing here is estimated or invented.
 * -----------------------------------------------------------
 */

const reportModel = require('../models/report.model');
const expenseModel = require('../models/expense.model');

function defaultRange(query) {
  const to = query.to || new Date().toISOString().slice(0, 10);
  const from = query.from || new Date(new Date(to).getFullYear(), new Date(to).getMonth(), 1).toISOString().slice(0, 10);
  return { from, to };
}

async function profitAndLoss(businessId, query) {
  const { from, to } = defaultRange(query);
  const [sales, expenseTotal, expensesByCategory] = await Promise.all([
    reportModel.salesTotals(businessId, from, to),
    expenseModel.totalForPeriod(businessId, from, to),
    expenseModel.byCategory(businessId, from, to),
  ]);

  const revenue = sales.revenue;
  const netProfit = revenue - expenseTotal;
  const margin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  return {
    range: { from, to },
    grossRevenue: revenue,
    collected: sales.collected,
    outstanding: sales.outstanding,
    invoiceCount: sales.invoice_count,
    expenses: expenseTotal,
    expensesByCategory,
    netProfit,
    margin: Math.round(margin * 100) / 100,
  };
}

async function salesReport(businessId, query) {
  const { from, to } = defaultRange(query);
  const [totals, byDay, top] = await Promise.all([
    reportModel.salesTotals(businessId, from, to),
    reportModel.salesByDay(businessId, from, to),
    reportModel.topProducts(businessId, from, to),
  ]);
  return { range: { from, to }, totals, byDay, topProducts: top };
}

async function customersReport(businessId, query) {
  const { from, to } = defaultRange(query);
  const [total, newInPeriod] = await Promise.all([
    reportModel.customerCount(businessId),
    reportModel.newCustomersInPeriod(businessId, from, to),
  ]);
  return { range: { from, to }, totalCustomers: total, newCustomers: newInPeriod };
}

async function invoicesReport(businessId) {
  const breakdown = await reportModel.invoiceStatusBreakdown(businessId);
  return { statusBreakdown: breakdown };
}

module.exports = { profitAndLoss, salesReport, customersReport, invoicesReport };
