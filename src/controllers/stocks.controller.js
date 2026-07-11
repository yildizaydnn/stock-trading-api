const stockService = require('../services/stock.service');
const asyncHandler = require('../middleware/asyncHandler');

const getAll = asyncHandler(async (req, res) => {
  const stocks = await stockService.getAllStocks();
  res.json(stocks);
});

module.exports = { getAll };
