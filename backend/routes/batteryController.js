const { User, Battery, BatteryReading } = require('../models');
const { validateBatteryReading } = require('../middleware/validation');
const { Op } = require('sequelize');

/* Helpers --------------------------------------------------------------- */
// simple numeric coercion helper
function toNumber(v, fallback = null) {
  if (v === undefined || v === null) return fallback;
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
}

const isUuid = (value) =>
  typeof value === 'string' &&
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);

const isDbConnectionError = (err) => {
  const msg = (err && err.message ? err.message : String(err)).toLowerCase();
  return msg.includes('econnrefused') || msg.includes('connect') || msg.includes('connection');
};

const findOrCreateUser = async (email) => {
  let user = await User.findOne({ where: { email } });
  if (!user) {
    user = await User.create({ email, isGuest: false });
  }
  return user;
};

const resolveOrCreateBattery = async (user, data) => {
  const identifier = data.batteryId || 'Primary Battery';
  let battery = null;

  if (isUuid(identifier)) {
    battery = await Battery.findOne({ where: { id: identifier, userId: user.id } });
  }

  if (!battery) {
    battery = await Battery.findOne({
      where: {
        userId: user.id,
        [Op.or]: [{ serialNumber: identifier }, { batteryName: identifier }],
      },
    });
  }

  if (!battery) {
    battery = await Battery.create({
      userId: user.id,
      batteryName: identifier,
      nominalVoltage: toNumber(data.nominalVoltage, 51.2),
      capacityWh: toNumber(data.capacityWh, 5222),
    });
  }

  return battery;
};

const buildReadingPayload = (data, batteryId) => ({
  email: data.email || null,
  batteryId,
  timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
  nominalVoltage: toNumber(data.nominalVoltage, null),
  capacityWh: toNumber(data.capacityWh, null),
  minCellVoltage: toNumber(data.minCellVoltage, null),
  maxCellVoltage: toNumber(data.maxCellVoltage, null),
  totalBatteryVoltage: toNumber(data.totalBatteryVoltage, 0),
  cellTemperature: toNumber(data.cellTemperature, 0),
  currentAmps: toNumber(data.currentAmps, 0),
  outputVoltage: toNumber(data.outputVoltage, null),
  stateOfCharge: toNumber(data.stateOfCharge, 0),
  chargingStatus: data.chargingStatus || 'INACTIVE',
  cellVoltages: Array.isArray(data.cellVoltages)
    ? data.cellVoltages.map((v) => toNumber(v, null)).filter((v) => v !== null)
    : [],
  rawPayload: data || null,
});

/* Controllers ----------------------------------------------------------- */

/**
 * POST /api/battery-readings
 * Save a new battery reading to the database (expects camelCase JSON with batteryId as text)
 */
const postBatteryReading = async (req, res, next) => {
  try {
    const data = req.body;

    // Validate input (expects camelCase fields)
    const validation = validateBatteryReading(data);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: validation.errors });
    }

    const user = await findOrCreateUser(data.email);
    const battery = await resolveOrCreateBattery(user, data);
    const created = await BatteryReading.create(buildReadingPayload(data, battery.id));

    return res.status(201).json({
      success: true,
      message: 'Battery reading recorded successfully',
      data: { id: created.id, batteryId: created.batteryId, createdAt: created.createdAt },
    });
  } catch (err) {
    if (isDbConnectionError(err)) {
      return res.status(503).json({ success: false, error: 'Database unavailable. Try again.' });
    }
    return next(err);
  }
};

/**
 * GET /api/battery-readings/:email
 */
const getBatteryReadings = async (req, res, next) => {
  try {
    const { email } = req.params;
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const batteries = await Battery.findAll({ where: { userId: user.id }, attributes: ['id'] });
    const batteryIds = batteries.map((b) => b.id);
    if (!batteryIds.length) return res.json({ success: true, data: [], pagination: { limit, offset, total: 0 } });

    const where = { batteryId: { [Op.in]: batteryIds } };
    const [readings, total] = await Promise.all([
      BatteryReading.findAll({ where, order: [['createdAt', 'DESC']], limit, offset }),
      BatteryReading.count({ where }),
    ]);

    return res.json({ success: true, data: readings, pagination: { limit, offset, total } });
  } catch (err) {
    if (isDbConnectionError(err)) {
      return res.status(503).json({ success: false, error: 'Database unavailable. Try again.' });
    }
    return next(err);
  }
};

/**
 * GET /api/battery-readings/:email/latest
 */
const getLatestReading = async (req, res, next) => {
  try {
    const { email } = req.params;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const batteries = await Battery.findAll({ where: { userId: user.id }, attributes: ['id'] });
    const batteryIds = batteries.map((b) => b.id);
    if (!batteryIds.length) return res.status(404).json({ success: false, error: 'No batteries found for user' });

    const reading = await BatteryReading.findOne({
      where: { batteryId: { [Op.in]: batteryIds } },
      order: [['createdAt', 'DESC']],
    });

    if (!reading) return res.status(404).json({ success: false, error: 'No readings found for user' });
    return res.json({ success: true, data: reading });
  } catch (err) {
    if (isDbConnectionError(err)) {
      return res.status(503).json({ success: false, error: 'Database unavailable. Try again.' });
    }
    return next(err);
  }
};

module.exports = {
  postBatteryReading,
  getBatteryReadings,
  getLatestReading,
};
