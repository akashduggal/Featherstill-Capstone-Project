const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Battery = sequelize.define(
  'Battery',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    batteryName: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Primary Battery',
    },
    serialNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nominalVoltage: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 51.2,
    },
    capacityWh: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 5222,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'ERROR'),
      defaultValue: 'ACTIVE',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'batteries',
    timestamps: true,
  }
);

module.exports = Battery;
