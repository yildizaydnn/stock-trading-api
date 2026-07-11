const pool = require("../db/pool");
const AppError = require("../utils/AppError");

async function buyStock(accountId, symbol, quantity) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: accountRows } = await client.query(
      "SELECT id, cash_balance FROM accounts WHERE id = $1 FOR UPDATE",
      [accountId],
    );

    if (accountRows.length === 0) {
      throw new AppError("Hesap bulunamadı", 404);
    }

    const account = accountRows[0];

    const { rows: stockRows } = await client.query(
      "SELECT symbol, price FROM stocks WHERE symbol = $1",
      [symbol],
    );

    if (stockRows.length === 0) {
      throw new AppError("Hisse bulunamadı", 404);
    }

    const stock = stockRows[0];

    const totalAmount = stock.price * quantity;

    if (account.cash_balance < totalAmount) {
      throw new AppError("Yetersiz bakiye", 400);
    }

    const { rows: updatedRows } = await client.query(
      "UPDATE accounts SET cash_balance = cash_balance - $1 WHERE id = $2 RETURNING cash_balance",
      [totalAmount, accountId],
    );
    const remainingBalance = updatedRows[0].cash_balance;

    await client.query(
      `INSERT INTO holdings (account_id, symbol, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (account_id, symbol)
       DO UPDATE SET quantity = holdings.quantity + $3`,
      [accountId, symbol, quantity],
    );

    await client.query(
      `INSERT INTO transactions (account_id, type, symbol, quantity, price, total_amount)
       VALUES ($1, 'BUY', $2, $3, $4, $5)`,
      [accountId, symbol, quantity, stock.price, totalAmount],
    );

    await client.query("COMMIT");

    return {
      type: "BUY",
      symbol,
      quantity,
      price: stock.price,
      totalAmount,
      remainingBalance,
    };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      console.error("ROLLBACK hatası:", rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { buyStock };
