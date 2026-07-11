const pool = require('../db/pool');

async function getAccountById(id) {
  const { rows } = await pool.query(
    'SELECT id, cash_balance, created_at FROM accounts WHERE id = $1',
    [id]
  );
  return rows[0] || null;
}

module.exports = { getAccountById };
