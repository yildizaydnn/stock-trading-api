const pg = require("pg");
const { Pool } = pg;

//PostgreSQL BIGINT (OID 20) varsayılan olarak string döner.
// Tutarlar kuruş cinsinden ve MAX_SAFE_INTEGER'ın çok altında olduğu için Number'a çevirmem gerekti.

pg.types.setTypeParser(20, (val) => parseInt(val, 10));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
