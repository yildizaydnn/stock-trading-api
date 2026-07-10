const express = require('express');
const pool = require('./db/pool');

const app = express();

app.use(express.json());

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'down' });
  }
});

module.exports = app;
