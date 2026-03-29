const fs = require('fs');
const { Sequelize } = require('sequelize');
const config = require('./index');

const env = process.env;
const toBool = (v, fallback = false) => (v === undefined ? fallback : String(v).toLowerCase() === 'true');
const toInt = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

const dbConfig = {
  ...config.database,
  name: env.DB_NAME || config.database.name,
  username: env.DB_USER || config.database.username,
  password: env.DB_PASSWORD || config.database.password,
  host: env.DB_HOST || config.database.host || 'localhost',
  port: toInt(env.DB_PORT, config.database.port || 5432),
  logging: env.DB_LOGGING !== undefined ? toBool(env.DB_LOGGING, false) : config.database.logging,
};

const requireSSL = toBool(env.DB_REQUIRE_SSL ?? env.DB_SSL, false);

const sequelizeOptions = {
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'postgres',
  logging: dbConfig.logging,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
  },
};

if (requireSSL) {
  const dialectOptions = { ssl: { require: true, rejectUnauthorized: false } };
  if (env.DB_SSL_CA) {
    try {
      dialectOptions.ssl.ca = fs.readFileSync(env.DB_SSL_CA);
      dialectOptions.ssl.rejectUnauthorized = true;
    } catch (readErr) {
      console.warn('[Database] Could not read DB_SSL_CA file:', readErr.message);
      dialectOptions.ssl.rejectUnauthorized = false;
    }
  }
  sequelizeOptions.dialectOptions = dialectOptions;
}

const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.username,
  dbConfig.password,
  sequelizeOptions
);

try {
  const masked = {
    host: dbConfig.host,
    port: dbConfig.port,
    name: dbConfig.name,
    username: dbConfig.username,
    password: dbConfig.password ? '***' : '(none)',
    ssl: requireSSL,
  };
  console.log('[Database] Effective DB config:', JSON.stringify(masked));
  if (dbConfig.host === 'localhost' || dbConfig.host === '127.0.0.1') {
    console.log('[Database] Using local Postgres (localhost).');
  }
} catch (e) {
  console.warn('[Database] Could not log DB config', e);
}

async function connectWithRetry() {
  const maxRetries = toInt(env.DB_CONNECT_RETRIES, 5);
  let delay = toInt(env.DB_CONNECT_RETRY_DELAY_MS, 5000);

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log(`[Database] PostgreSQL connected to ${dbConfig.host}:${dbConfig.port}/${dbConfig.name} (ssl=${requireSSL})`);
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        console.warn('[Database] Not connected to PostgreSQL (OK for development):', err?.message || err);
        console.warn('[Database] Continuing without database persistence...');
        return;
      }
      console.warn(`[Database] Connection attempt ${attempt + 1}/${maxRetries} failed: ${err?.message || err}. Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
      delay = Math.min(delay * 2, 60000);
    }
  }
}

connectWithRetry();

async function testConnection() {
  try {
    await sequelize.authenticate();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err && err.message ? err.message : String(err) };
  }
}
sequelize.testConnection = testConnection;

module.exports = sequelize;
