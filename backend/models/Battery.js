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
      allowNull: true, // optional
    },
    moduleId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'moduleId',
    },
  },
  {
    tableName: 'batteries',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { unique: true, fields: ['userId', 'moduleId'] },
    ],
  }
);

module.exports = Battery;
