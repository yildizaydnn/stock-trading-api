require('dotenv').config();
const app = require('./app');
const pool = require('./db/pool');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server ${PORT} portunda çalışıyor`);
});

function shutdown() {
  console.log('Sunucu kapatılıyor...');
  server.close(() => {
    console.log('HTTP sunucusu kapatıldı');
    pool.end(() => {
      console.log('DB bağlantıları kapatıldı');
      process.exit(0);
    });
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
