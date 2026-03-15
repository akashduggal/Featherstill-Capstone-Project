const fs = require('fs');
const { Sequelize } = require('sequelize');
const config = require('./index');

const env = process.env;

// Merge config with optional environment overrides (local-first)
const dbConfig = {
  ...config.database,
  name: env.DB_NAME || config.database.name,
  username: env.DB_USER || config.database.username,
  password: env.DB_PASSWORD || config.database.password,
  host: env.DB_HOST || config.database.host || 'localhost',
  port: env.DB_PORT ? parseInt(env.DB_PORT, 10) : (config.database.port || 5432),
  logging: env.DB_LOGGING ? env.DB_LOGGING === 'true' : config.database.logging,
};

// For local Postgres keep SSL off by default. You can enable via env if needed.
const requireSSL = (env.DB_REQUIRE_SSL || env.DB_SSL) ? (String(env.DB_REQUIRE_SSL || env.DB_SSL).toLowerCase() === 'true') : false;

// Build Sequelize options (simple local config)
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

// No TLS options for local by default; keep code path if someone enables SSL via env
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

// Create sequelize instance
const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.username,
  dbConfig.password,
  sequelizeOptions
);

// Diagnostic: show effective DB config (mask password)
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

// Connection with retry to handle transient starts
async function connectWithRetry() {
  const maxRetries = parseInt(env.DB_CONNECT_RETRIES, 10) || 5;
  let delay = parseInt(env.DB_CONNECT_RETRY_DELAY_MS, 10) || 5000;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await sequelize.authenticate();
      console.log(`[Database] PostgreSQL connected to ${dbConfig.host}:${dbConfig.port}/${dbConfig.name} (ssl=${requireSSL})`);
      return;
    } catch (err) {
      if (attempt === maxRetries) {
        console.warn('[Database] Not connected to PostgreSQL (OK for development):', err && err.message ? err.message : err);
        console.warn('[Database] Continuing without database persistence...');
        return;
      }
      console.warn(`[Database] Connection attempt ${attempt + 1}/${maxRetries} failed: ${err && err.message ? err.message : err}. Retrying in ${delay}ms...`);
      /* eslint-disable no-await-in-loop */
      await new Promise((res) => setTimeout(res, delay));
      delay = Math.min(delay * 2, 60000);
      /* eslint-enable no-await-in-loop */
    }
  }
}

// Start connection attempts but export sequelize immediately
connectWithRetry();

// Attach a helper to quickly test connectivity from other modules
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
