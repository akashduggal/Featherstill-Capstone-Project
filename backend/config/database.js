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

// Test connection
sequelize
  .authenticate()
  .then(() => {
    console.log('[Database] PostgreSQL connection established successfully.');
  })
  .catch((err) => {
    console.error('[Database] Unable to connect to PostgreSQL:', err.message);
  });

module.exports = sequelize;
