const path = require('path');
// ensure we load the backend/.env regardless of process.cwd()
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });
try {
  console.log(`[Config] Loaded .env from ${envPath}`);
} catch (e) {
  console.warn('[Config] Could not log .env path', e);
}

module.exports = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
    name: process.env.DB_NAME || 'postgres',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  },
  app: {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    logLevel: process.env.LOG_LEVEL || 'info',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
};
