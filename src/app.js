const express = require('express');
const pool = require('./db/pool');
const stocksRoutes = require('./routes/stocks.routes');

const app = express();

app.use(express.json());

app.use('/stocks', stocksRoutes);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'down' });
  }
});

module.exports = app;
