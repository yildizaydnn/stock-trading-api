const stockService = require('../services/stock.service');

async function getAll(req, res) {
  const stocks = await stockService.getAllStocks();
  res.json(stocks);
}

module.exports = { getAll };
