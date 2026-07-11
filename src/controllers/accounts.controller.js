const accountService = require('../services/account.service');
const asyncHandler = require('../middleware/asyncHandler');
const { toTL } = require('../utils/money');

const getById = asyncHandler(async (req, res) => {
  const account = await accountService.getAccountById(req.params.id);
  res.json({
    id: account.id,
    cashBalance: toTL(account.cash_balance),
    createdAt: account.created_at,
  });
});

const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await accountService.getPortfolio(req.params.id);
  res.json({
    holdings: portfolio.holdings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      quantity: h.quantity,
      price: toTL(h.price),
      totalValue: toTL(h.total_value),
    })),
    totalValue: toTL(portfolio.totalValue),
    cashBalance: toTL(portfolio.cashBalance),
    totalAssets: toTL(portfolio.totalAssets),
  });
});

const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await accountService.getTransactions(req.params.id);
  res.json(
    transactions.map((t) => ({
      id: t.id,
      type: t.type,
      symbol: t.symbol,
      quantity: t.quantity,
      price: toTL(t.price),
      totalAmount: toTL(t.total_amount),
      createdAt: t.created_at,
    }))
  );
});

module.exports = { getById, getPortfolio, getTransactions };
