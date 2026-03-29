const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BatteryReading = sequelize.define(
  'BatteryReading',
  {
    id: {
      // match DB: integer primary key with sequence
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: 'id',
    },

    // foreign key to batteries.id stored as text (UUID string) in DB
    batteryId: {
      type: DataTypes.UUID, // maps cleanly to DB 'text'
      allowNull: false,
      field: 'batteryId',
      references: {
        model: 'batteries',
        key: 'id',
      },
    },

    // original telemetry timestamp (server or device time)
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'timestamp',
    },

    // basic battery metadata numeric columns (camelCase attributes mapped to snake_case columns)
    nominalVoltage: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    capacityWh: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    minCellVoltage: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    maxCellVoltage: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    totalBatteryVoltage: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    cellTemperature: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    currentAmps: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    outputVoltage: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    stateOfCharge: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    chargingStatus: {
      type: DataTypes.ENUM('CHARGING', 'DISCHARGING', 'INACTIVE'),
      allowNull: true,
      defaultValue: 'INACTIVE',
    },

    // use native Postgres array for numeric cell voltages (maps to cell_voltages)
    cellVoltages: {
      type: DataTypes.ARRAY(DataTypes.FLOAT),
      allowNull: true,
      defaultValue: [],
    },

    // store the raw incoming payload for debugging/audit
    rawPayload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    // record createdAt explicitly (map to created_at)
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'battery_readings',
    timestamps: false, // we manage createdAt/timestamp explicitly
    indexes: [
      { fields: ['batteryId'] },
      { fields: ['createdAt'] },
      { fields: ['timestamp'] },
    ],
  }
);

module.exports = BatteryReading;
