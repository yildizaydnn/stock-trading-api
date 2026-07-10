const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function seed() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(schema);
  console.log('Tablolar oluşturuldu');

  await pool.query(`
    INSERT INTO stocks (symbol, name, price) VALUES
      ('THYAO', 'Türk Hava Yolları', 30000),
      ('GARAN', 'Garanti Bankası', 13000),
      ('ASELS', 'Aselsan', 7500)
    ON CONFLICT (symbol) DO NOTHING
  `);
  console.log('Hisseler eklendi');

  await pool.query(`
    INSERT INTO accounts (id, cash_balance) VALUES (1, 10000000)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('Hesap oluşturuldu (100.000 TL)');

  await pool.end();
  console.log('Seed tamamlandı');
}

seed().catch((err) => {
  console.error('Seed hatası:', err);
  process.exit(1);
});
