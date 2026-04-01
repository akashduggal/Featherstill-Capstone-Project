const { User, Battery, BatteryReading } = require('../models');
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
  const safeEmail = (typeof email === 'string' && email.includes('@')) ? email : 'guest@featherstill.local';
  let user = await User.findOne({ where: { email: safeEmail } });
  if (!user) {
    user = await User.create({ email: safeEmail, isGuest: safeEmail.startsWith('guest@') });
  }
  return user;
};

const getModuleId = (data) => {
  const raw = data?.moduleId || data?.moduleID || data?.batteryId || 'ESP32';
  return typeof raw === 'string' ? raw.trim() || 'ESP32' : 'ESP32';
};

const normalizeIncomingItem = (item) => {
  const p = item?.payload && typeof item.payload === 'object' ? item.payload : item;
  return {
    localId: Number.isInteger(item?.localId) ? item.localId : null,
    email: item?.email || p?.email,
    moduleId: item?.moduleId || item?.moduleID || item?.batteryId || p?.moduleId || p?.moduleID || p?.batteryId || 'ESP32',
    batteryName: item?.batteryName || p?.batteryName || null,
    timestamp: item?.timestamp || p?.timestamp || (item?.ts ? new Date(item.ts).toISOString() : undefined),
    nominalVoltage: p?.nominalVoltage,
    capacityWh: p?.capacityWh,
    minCellVoltage: p?.minCellVoltage,
    maxCellVoltage: p?.maxCellVoltage,
    totalBatteryVoltage: p?.totalBatteryVoltage,
    cellTemperature: p?.cellTemperature,
    currentAmps: p?.currentAmps,
    outputVoltage: p?.outputVoltage,
    stateOfCharge: p?.stateOfCharge,
    chargingStatus: p?.chargingStatus,
    cellVoltages: p?.cellVoltages,
    rawPayload: item,
  };
};

const resolveOrCreateBattery = async (user, data) => {
  const moduleId = getModuleId(data);
  let battery = null;

  if (isUuid(moduleId)) {
    battery = await Battery.findOne({ where: { id: moduleId, userId: user.id } });
  }

  if (!battery) {
    battery = await Battery.findOne({ where: { userId: user.id, moduleId } });
  }

  if (!battery) {
    battery = await Battery.create({
      userId: user.id,
      moduleId,
      batteryName: data.batteryName || null,
    });
  }

  return battery;
};

const buildReadingPayload = (data, batteryId) => ({
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

const createReading = async (rawItem) => {
  const data = normalizeIncomingItem(rawItem);
  const user = await findOrCreateUser(data.email);
  const battery = await resolveOrCreateBattery(user, data);
  const created = await BatteryReading.create(buildReadingPayload(data, battery.id));
  return { created, battery, localId: data.localId };
};

/* Controllers ----------------------------------------------------------- */

/**
 * POST /api/battery-readings
 * Save a new battery reading to the database (expects camelCase JSON with batteryId as text)
 */
const postBatteryReading = async (req, res, next) => {
  try {
    const isBatch = Array.isArray(req.body?.batch);
    const items = isBatch ? req.body.batch : [req.body];

    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Empty batch payload' });
    }

    const successLocalIds = [];
    const failures = [];
    let createdCount = 0;
    let lastCreated = null;
    let lastBattery = null;

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      try {
        const { created, battery, localId } = await createReading(item);
        createdCount += 1;
        lastCreated = created;
        lastBattery = battery;
        if (Number.isInteger(localId)) successLocalIds.push(localId);
      } catch (err) {
        failures.push({ index: i, localId: item?.localId ?? null, error: err.message || 'Failed to insert row' });
      }
    }

    if (!isBatch) {
      if (!lastCreated) {
        return res.status(400).json({ success: false, error: failures[0]?.error || 'Failed to insert reading' });
      }
      return res.status(201).json({
        success: true,
        message: 'Battery reading recorded successfully',
        data: {
          id: lastCreated.id,
          batteryId: lastCreated.batteryId,
          moduleId: lastBattery?.moduleId,
          createdAt: lastCreated.createdAt,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Batch processed',
      data: {
        received: items.length,
        createdCount,
        failedCount: failures.length,
        successLocalIds,
        failures,
      },
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
