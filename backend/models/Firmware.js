const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Firmware = sequelize.define(
  'Firmware',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        isSemanticVersion(value) {
          const semverRegex = /^\d+\.\d+\.\d+$/;
          if (!semverRegex.test(value)) {
            throw new Error('Version must follow semantic versioning (e.g., 1.0.0)');
          }
        },
      },
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        is: /\.bin$/i,
      },
    },
    file_hash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'SHA256 hash of the firmware file',
    },
    file_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'File size in bytes',
    },
    changelog: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Release notes and changes',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this is the current recommended firmware version',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    tableName: 'firmware_versions',
    timestamps: false,
    underscored: true,
  }
);

module.exports = Firmware;
