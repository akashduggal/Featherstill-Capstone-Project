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

    console.log(`[Battery API] Received reading for battery: ${data.batteryId}`);

    // Find or create user
    let user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      user = await User.create({
        email: data.email,
        isGuest: !data.email || !data.email.includes('@'),
      });
      console.log(`[Battery API] Created new user: ${user.email}`);
    }

    // Resolve batteryId (candidate may be id / serialNumber / batteryName)
    // Resolve battery safely:
    // - if batteryId looks like a UUID, try findByPk
    // - otherwise treat it as a batteryName or serialNumber for this user
    let battery = null;
    if (data.batteryId) {
      const isUuid = typeof data.batteryId === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(data.batteryId);
      if (isUuid) {
        battery = await Battery.findByPk(data.batteryId);
        if (!battery) {
          battery = await Battery.findOne({
            where: {
              userId: user.id,
              [Op.or]: [{ serialNumber: data.batteryId }, { batteryName: data.batteryId }],
            },
          });
        }
      } else {
        battery = await Battery.findOne({
          where: {
            userId: user.id,
            [Op.or]: [{ serialNumber: data.batteryId }, { batteryName: data.batteryId }],
          },
        });
      }
    } else {
      // fallback to default battery name for this user
      battery = await Battery.findOne({ where: { userId: user.id, batteryName: 'Primary Battery' } });
    }

    // Create battery if missing
    if (!battery) {
      battery = await Battery.create({
        userId: user.id,
        batteryName: data.batteryId || 'Primary Battery',
        nominalVoltage: toNumber(data.nominalVoltage, 51.2),
        capacityWh: toNumber(data.capacityWh, 5222),
      });
      console.log(`[Battery API] Created new battery: ${battery.batteryName}`);
    }

    const batteryIdToStore = battery.id;
    if (!batteryIdToStore) {
      return res.status(400).json({ success: false, error: 'Unable to resolve batteryId' });
    }

    // Build model object using camelCase attributes (coerce numeric fields)
    const toCreate = {
      email: data.email || null,
      batteryId: batteryIdToStore,
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
      cellVoltages: Array.isArray(data.cellVoltages) ? data.cellVoltages.map(v => toNumber(v, null)).filter(v => v !== null) : null,
      rawPayload: data || null,
    };

    // Create the reading
    const created = await BatteryReading.create(toCreate);

    console.log(`[Battery API] Saved reading: ${created.id} for battery: ${battery.id}`);

    return res.status(201).json({
      success: true,
      message: 'Battery reading recorded successfully',
      data: {
        id: created.id,
        batteryId: created.batteryId,
        createdAt: created.createdAt || created.created_at,
      },
    });
  } catch (err) {
    // friendly handling for DB connection issues
    if (err && err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('connect'))) {
      console.log('[Battery API] Database connection refused - validation-only mode');
      return res.status(201).json({
        success: true,
        message: 'Battery reading validated successfully (database not available)',
        data: { note: 'Validated but not persisted' },
      });
    }
    console.error('[Battery API] Error in postBatteryReading:', err && err.message ? err.message : err);
    next(err);
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

    const batteries = await Battery.findAll({ where: { userId: user.id } });
    if (!batteries.length) return res.json({ success: true, data: [], message: 'No batteries found for user' });

    const batteryIds = batteries.map((b) => b.id);

    const readings = await BatteryReading.findAll({
      where: { batteryId: batteryIds },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const total = await BatteryReading.count({ where: { batteryId: batteryIds } });

    return res.json({ success: true, data: readings, pagination: { limit, offset, total } });
  } catch (err) {
    if (err && err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('connect'))) {
      console.log('[Battery API] Database connection refused - returning empty');
      return res.json({ success: true, data: [], message: 'Database not connected - no readings available', pagination: { limit: 0, offset: 0, total: 0 } });
    }
    console.error('[Battery API] Error in getBatteryReadings:', err && err.message ? err.message : err);
    next(err);
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

    const batteries = await Battery.findAll({ where: { userId: user.id } });
    if (!batteries.length) return res.status(404).json({ success: false, error: 'No batteries found for user' });

    const batteryIds = batteries.map((b) => b.id);
    const reading = await BatteryReading.findOne({ where: { batteryId: batteryIds }, order: [['createdAt', 'DESC']] });

    if (!reading) return res.status(404).json({ success: false, error: 'No readings found for user' });

    return res.json({ success: true, data: reading });
  } catch (err) {
    if (err && err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('connect'))) {
      console.log('[Battery API] Database connection refused');
      return res.status(404).json({ success: false, error: 'Database not connected - no readings available' });
    }
    console.error('[Battery API] Error in getLatestReading:', err && err.message ? err.message : err);
    next(err);
  }
};

module.exports = {
  postBatteryReading,
  getBatteryReadings,
  getLatestReading,
};
