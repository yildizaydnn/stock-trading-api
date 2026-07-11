const orderService = require('../services/order.service');
const asyncHandler = require('../middleware/asyncHandler');

const buy = asyncHandler(async (req, res) => {
  const { accountId, symbol, quantity } = req.body;
  const result = await orderService.buyStock(accountId, symbol, quantity);
  res.status(201).json(result);
});

const sell = asyncHandler(async (req, res) => {
  const { accountId, symbol, quantity } = req.body;
  const result = await orderService.sellStock(accountId, symbol, quantity);
  res.status(201).json(result);
});

module.exports = { buy, sell };
