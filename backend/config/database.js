const { Sequelize } = require('sequelize');
const config = require('./index');

const dbConfig = config.database;

const sequelize = new Sequelize(
  dbConfig.name,
  dbConfig.username,
  dbConfig.password,
  {
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
    timestamps: true,
  }
);

// Test connection (don't fail if DB not available)
sequelize
  .authenticate()
  .then(() => {
    console.log('[Database] PostgreSQL connection established successfully.');
  })
  .catch((err) => {
    console.warn('[Database] Not connected to PostgreSQL (OK for development):', err.message);
    console.warn('[Database] Continuing without database persistence...');
  });

module.exports = sequelize;
