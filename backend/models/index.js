const User = require('./User');
const Battery = require('./Battery');
const BatteryReading = require('./BatteryReading');

// Define associations
User.hasMany(Battery, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

Battery.belongsTo(User, {
  foreignKey: 'userId',
});

Battery.hasMany(BatteryReading, {
  foreignKey: 'batteryId',
  sourceKey: 'id',
  onDelete: 'CASCADE',
  constraints: false,
});

BatteryReading.belongsTo(Battery, {
  foreignKey: 'batteryId',
  targetKey: 'id',
  constraints: false,
});

module.exports = {
  User,
  Battery,
  BatteryReading,
};
