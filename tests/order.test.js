require('dotenv').config();
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');
const fs = require('fs');
const path = require('path');

before(async () => {
  // Test öncesi veritabanını sıfırla
  await pool.query('DROP TABLE IF EXISTS transactions');
  await pool.query('DROP TABLE IF EXISTS holdings');
  await pool.query('DROP TABLE IF EXISTS accounts');
  await pool.query('DROP TABLE IF EXISTS stocks');

  const schema = fs.readFileSync(path.join(__dirname, '../src/db/schema.sql'), 'utf-8');
  await pool.query(schema);

  await pool.query(`
    INSERT INTO stocks (symbol, name, price) VALUES
      ('THYAO', 'Türk Hava Yolları', 30000),
      ('GARAN', 'Garanti Bankası', 13000),
      ('ASELS', 'Aselsan', 7500)
  `);

  await pool.query(`
    INSERT INTO accounts (id, cash_balance) VALUES (1, 10000000)
  `);
});

after(async () => {
  await pool.end();
});

describe('POST /orders/buy', () => {
  it('başarılı alım yapabilmeli', async () => {
    const res = await request(app)
      .post('/orders/buy')
      .send({ accountId: 1, symbol: 'THYAO', quantity: 10 });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.type, 'BUY');
    assert.strictEqual(res.body.symbol, 'THYAO');
    assert.strictEqual(res.body.quantity, 10);
  });

  it('yetersiz bakiyeyle alım reddedilmeli', async () => {
    const res = await request(app)
      .post('/orders/buy')
      .send({ accountId: 1, symbol: 'THYAO', quantity: 99999 });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Yetersiz bakiye');
  });

  it('olmayan hesapla alım reddedilmeli', async () => {
    const res = await request(app)
      .post('/orders/buy')
      .send({ accountId: 999, symbol: 'THYAO', quantity: 1 });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'Hesap bulunamadı');
  });

  it('olmayan sembolle alım reddedilmeli', async () => {
    const res = await request(app)
      .post('/orders/buy')
      .send({ accountId: 1, symbol: 'XXXXX', quantity: 1 });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'Hisse bulunamadı');
  });
});

describe('POST /orders/sell', () => {
  it('başarılı satım yapabilmeli', async () => {
    const res = await request(app)
      .post('/orders/sell')
      .send({ accountId: 1, symbol: 'THYAO', quantity: 5 });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.type, 'SELL');
    assert.strictEqual(res.body.quantity, 5);
  });

  it('yetersiz hisseyle satım reddedilmeli', async () => {
    const res = await request(app)
      .post('/orders/sell')
      .send({ accountId: 1, symbol: 'THYAO', quantity: 99999 });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Satılacak yeterli hisse yok');
  });

  it('portföyde olmayan hisseyi satamamalı', async () => {
    const res = await request(app)
      .post('/orders/sell')
      .send({ accountId: 1, symbol: 'ASELS', quantity: 1 });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Satılacak yeterli hisse yok');
  });
});

describe('Girdi doğrulama', () => {
  it('sıfır adet reddedilmeli', async () => {
    const res = await request(app)
      .post('/orders/buy')
      .send({ accountId: 1, symbol: 'THYAO', quantity: 0 });

    assert.strictEqual(res.status, 400);
  });

  it('negatif adet reddedilmeli', async () => {
    const res = await request(app)
      .post('/orders/buy')
      .send({ accountId: 1, symbol: 'THYAO', quantity: -5 });

    assert.strictEqual(res.status, 400);
  });

  it('ondalık adet reddedilmeli', async () => {
    const res = await request(app)
      .post('/orders/buy')
      .send({ accountId: 1, symbol: 'THYAO', quantity: 2.5 });

    assert.strictEqual(res.status, 400);
  });

  it('eksik alan reddedilmeli', async () => {
    const res = await request(app)
      .post('/orders/buy')
      .send({ accountId: 1, symbol: 'THYAO' });

    assert.strictEqual(res.status, 400);
  });
});
