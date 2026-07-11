const pool = require('../db/pool');

async function getAllStocks() {
  const { rows } = await pool.query('SELECT symbol, name, price FROM stocks');
  return rows;
}

module.exports = { getAllStocks };
