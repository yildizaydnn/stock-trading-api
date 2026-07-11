const stockService = require('../services/stock.service');
const asyncHandler = require('../middleware/asyncHandler');
const { toTL } = require('../utils/money');

const getAll = asyncHandler(async (req, res) => {
  const stocks = await stockService.getAllStocks();
  res.json(
    stocks.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      price: toTL(s.price),
    }))
  );
});

module.exports = { getAll };
