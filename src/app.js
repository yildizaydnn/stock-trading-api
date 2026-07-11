const express = require('express');
const pool = require('./db/pool');
const stocksRoutes = require('./routes/stocks.routes');
const accountsRoutes = require('./routes/accounts.routes');
const ordersRoutes = require('./routes/orders.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(express.json());

app.use('/stocks', stocksRoutes);
app.use('/accounts', accountsRoutes);
app.use('/orders', ordersRoutes);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'down' });
  }
});

app.use(errorHandler);

module.exports = app;
