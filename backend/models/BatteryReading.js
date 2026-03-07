const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BatteryReading = sequelize.define(
  'BatteryReading',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    batteryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'batteries',
        key: 'id',
      },
    },
    totalBatteryVoltage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    cellTemperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: -50,
        max: 85,
      },
    },
    currentAmps: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    stateOfCharge: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 100,
      },
    },
    chargingStatus: {
      type: DataTypes.ENUM('CHARGING', 'DISCHARGING', 'INACTIVE'),
      defaultValue: 'INACTIVE',
    },
    cellVoltages: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'battery_readings',
    timestamps: false,
    indexes: [
      {
        fields: ['batteryId'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

module.exports = BatteryReading;
