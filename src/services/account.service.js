const pool = require('../db/pool');
const AppError = require('../utils/AppError');

async function getAccountById(id) {
  const { rows } = await pool.query(
    'SELECT id, cash_balance, created_at FROM accounts WHERE id = $1',
    [id]
  );
  if (rows.length === 0) {
    throw new AppError('Hesap bulunamadı', 404);
  }
  return rows[0];
}

async function getPortfolio(accountId) {
  // Hesap yoksa 404 fırlatır
  const account = await getAccountById(accountId);

  const { rows } = await pool.query(
    `SELECT h.symbol, h.quantity, s.name, s.price,
            (h.quantity * s.price)::bigint AS total_value
     FROM holdings h
     JOIN stocks s ON h.symbol = s.symbol
     WHERE h.account_id = $1`,
    [accountId]
  );

  const totalValue = rows.reduce((sum, r) => sum + r.total_value, 0);

  return {
    holdings: rows,
    totalValue,
    cashBalance: account.cash_balance,
    totalAssets: account.cash_balance + totalValue,
  };
}

async function getTransactions(accountId) {
  // Hesap yoksa 404 fırlatır
  await getAccountById(accountId);

  const { rows } = await pool.query(
    `SELECT id, type, symbol, quantity, price, total_amount, created_at
     FROM transactions
     WHERE account_id = $1
     ORDER BY created_at DESC`,
    [accountId]
  );
  return rows;
}

module.exports = { getAccountById, getPortfolio, getTransactions };
