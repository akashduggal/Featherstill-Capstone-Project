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
  onDelete: 'CASCADE',
});

BatteryReading.belongsTo(Battery, {
  foreignKey: 'batteryId',
});

module.exports = {
  User,
  Battery,
  BatteryReading,
};
