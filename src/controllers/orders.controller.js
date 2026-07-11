const orderService = require('../services/order.service');
const asyncHandler = require('../middleware/asyncHandler');
const { toTL } = require('../utils/money');

function formatOrderResponse(result) {
  return {
    type: result.type,
    symbol: result.symbol,
    quantity: result.quantity,
    price: toTL(result.price),
    totalAmount: toTL(result.totalAmount),
    remainingBalance: toTL(result.remainingBalance),
  };
}

const buy = asyncHandler(async (req, res) => {
  const { accountId, symbol, quantity } = req.body;
  const result = await orderService.buyStock(accountId, symbol, quantity);
  res.status(201).json(formatOrderResponse(result));
});

const sell = asyncHandler(async (req, res) => {
  const { accountId, symbol, quantity } = req.body;
  const result = await orderService.sellStock(accountId, symbol, quantity);
  res.status(201).json(formatOrderResponse(result));
});

module.exports = { buy, sell };
