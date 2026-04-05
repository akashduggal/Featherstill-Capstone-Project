const { User, Battery, BatteryReading } = require('../models');
const { Op } = require('sequelize');
const admin = require('firebase-admin'); 

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

const initFirebaseAdmin = () => {
  if (admin.apps.length) return;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured');
  }

  const serviceAccount = JSON.parse(raw);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};

const extractBearerToken = (req) => {
  const auth = req.headers?.authorization || '';
  if (auth.startsWith('Bearer ')) {
    const token = auth.slice(7).trim();
    console.log('[BatteryAPI] Bearer token extracted:', {
      requestId: req.id,
      hasToken: !!token,
      tokenLength: token.length,
    });
    return token;
  }
  console.warn('[BatteryAPI] Missing/invalid Authorization header:', {
    requestId: req.id,
    authorizationPrefix: auth ? auth.split(' ')[0] : '(empty)',
  });
  return '';
};

const resolveUserFromFirebaseToken = async (firebaseToken) => {
  if (!firebaseToken || typeof firebaseToken !== 'string') {
    const err = new Error('Missing firebaseToken');
    err.statusCode = 401;
    throw err;
  }

  initFirebaseAdmin();

  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(firebaseToken);
    console.log('[BatteryAPI] Firebase token verified:', {
      uid: decoded.uid,
      aud: decoded.aud,
      iss: decoded.iss,
    });
  } catch (e) {
    console.error('[BatteryAPI] Firebase token verification failed:', {
      code: e?.code,
      message: e?.message,
    });
    const err = new Error('Invalid firebase token');
    err.statusCode = 401;
    throw err;
  }

  const userRecord = await admin.auth().getUser(decoded.uid);
  const resolvedEmail = userRecord.email || decoded.email;

  if (!resolvedEmail) {
    const err = new Error('Firebase user has no email mapped');
    err.statusCode = 400;
    throw err;
  }

  return findOrCreateUser(resolvedEmail);
};

const normalizeIncomingItem = (item) => {
  const payload = item?.payload && typeof item.payload === 'object' ? item.payload : {};
  const ts = Number(item?.ts);

  return {
    localId: Number.isInteger(item?.localId) ? item.localId : null,
    moduleId: (typeof item?.moduleId === 'string' && item.moduleId.trim()) ? item.moduleId.trim() : 'ESP32',
    batteryName: item?.batteryName || null,
    ts: Number.isFinite(ts) ? ts : Date.now(), // epoch ms
    nominalVoltage: payload?.nominalVoltage,
    capacityWh: payload?.capacityWh,
    minCellVoltage: payload?.minCellVoltage,
    maxCellVoltage: payload?.maxCellVoltage,
    totalBatteryVoltage: payload?.totalBatteryVoltage,
    cellTemperature: payload?.cellTemperature,
    currentAmps: payload?.currentAmps,
    outputVoltage: payload?.outputVoltage,
    stateOfCharge: payload?.stateOfCharge,
    chargingStatus: payload?.chargingStatus,
    cellVoltages: payload?.cellVoltages,
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
  timestamp: new Date(data.ts), // epoch ms from frontend
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

const createReading = async (rawItem, requestToken) => {
  const data = normalizeIncomingItem(rawItem);
  const user = await resolveUserFromFirebaseToken(requestToken); // header token only
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
    const body = req.body;
    const isBatchObject = Array.isArray(body?.batch);
    const isRawArray = Array.isArray(body);
    const items = isBatchObject ? body.batch : (isRawArray ? body : [body]);
    const isBatch = isBatchObject || isRawArray;

    const requestToken = extractBearerToken(req);

    console.log('[BatteryAPI] Incoming POST summary:', {
      requestId: req.id,
      isBatch,
      itemCount: items.length,
      hasToken: !!requestToken,
    });

    if (!items.length) {
      return res.status(400).json({ success: false, error: 'Empty payload' });
    }

    const successLocalIds = [];
    const failures = [];
    let createdCount = 0;
    let lastCreated = null;
    let lastBattery = null;

    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      try {
        const { created, battery, localId } = await createReading(item, requestToken);
        createdCount += 1;
        lastCreated = created;
        lastBattery = battery;
        if (Number.isInteger(localId)) successLocalIds.push(localId);
      } catch (err) {
        const statusCode = err?.statusCode || 400;
        failures.push({
          index: i,
          localId: item?.localId ?? null,
          statusCode,
          error: err.message || 'Failed to insert row',
        });
      }
    }

    console.log('[BatteryAPI] Processing result:', {
      requestId: req.id,
      createdCount,
      failedCount: failures.length,
      successLocalIdsCount: successLocalIds.length,
    });

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
