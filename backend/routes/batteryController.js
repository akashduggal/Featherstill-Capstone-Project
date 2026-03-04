const { User, Battery, BatteryReading } = require('../models');
const { validateBatteryReading } = require('../middleware/validation');

/**
 * POST /api/battery-readings
 * Save a new battery reading to the database
 */
const postBatteryReading = async (req, res, next) => {
  try {
    const data = req.body;

    // Validate input
    const validation = validateBatteryReading(data);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors,
      });
    }

    console.log(`[Battery API] Received reading for battery: ${data.batteryId}`);

    // Find or create user
    let user = await User.findOne({ where: { email: data.email } });
    if (!user) {
      user = await User.create({
        email: data.email,
        isGuest: !data.email.includes('@') || data.email === 'guest',
      });
      console.log(`[Battery API] Created new user: ${user.email}`);
    }

    // Find or create battery for user
    let battery = await Battery.findOne({
      where: {
        userId: user.id,
        batteryName: data.batteryId || 'Primary Battery',
      },
    });

    if (!battery) {
      battery = await Battery.create({
        userId: user.id,
        batteryName: data.batteryId || 'Primary Battery',
        nominalVoltage: data.nominalVoltage || 51.2,
        capacityWh: data.capacityWh || 5222,
      });
      console.log(`[Battery API] Created new battery: ${battery.batteryName}`);
    }

    // Create battery reading
    const reading = await BatteryReading.create({
      batteryId: battery.id,
      totalBatteryVoltage: data.totalBatteryVoltage,
      cellTemperature: data.cellTemperature,
      currentAmps: data.currentAmps,
      stateOfCharge: data.stateOfCharge,
      chargingStatus: data.chargingStatus || 'INACTIVE',
      cellVoltages: data.cellVoltages || [],
    });

    console.log(
      `[Battery API] Saved reading: ${reading.id} for battery: ${battery.id}`
    );

    res.status(201).json({
      success: true,
      message: 'Battery reading recorded successfully',
      data: {
        id: reading.id,
        batteryId: reading.batteryId,
        createdAt: reading.createdAt,
      },
    });
  } catch (error) {
    console.error('[Battery API] Error in postBatteryReading:', error.message);
    next(error);
  }
};

/**
 * GET /api/battery-readings/:email
 * Fetch all battery readings for a user
 */
const getBatteryReadings = async (req, res, next) => {
  try {
    const { email } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Find all batteries for user
    const batteries = await Battery.findAll({
      where: { userId: user.id },
    });

    if (batteries.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No batteries found for user',
      });
    }

    const batteryIds = batteries.map((b) => b.id);

    // Fetch readings
    const readings = await BatteryReading.findAll({
      where: {
        batteryId: batteryIds,
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    const total = await BatteryReading.count({
      where: {
        batteryId: batteryIds,
      },
    });

    console.log(
      `[Battery API] Fetched ${readings.length} readings for user: ${email}`
    );

    res.json({
      success: true,
      data: readings,
      pagination: {
        limit,
        offset,
        total,
      },
    });
  } catch (error) {
    console.error('[Battery API] Error in getBatteryReadings:', error.message);
    next(error);
  }
};

/**
 * GET /api/battery-readings/:email/latest
 * Get the most recent battery reading for a user
 */
const getLatestReading = async (req, res, next) => {
  try {
    const { email } = req.params;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Find all batteries for user
    const batteries = await Battery.findAll({
      where: { userId: user.id },
    });

    if (batteries.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No batteries found for user',
      });
    }

    const batteryIds = batteries.map((b) => b.id);

    // Fetch latest reading
    const reading = await BatteryReading.findOne({
      where: {
        batteryId: batteryIds,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        error: 'No readings found for user',
      });
    }

    console.log(
      `[Battery API] Fetched latest reading for user: ${email}`
    );

    res.json({
      success: true,
      data: reading,
    });
  } catch (error) {
    console.error('[Battery API] Error in getLatestReading:', error.message);
    next(error);
  }
};

module.exports = {
  postBatteryReading,
  getBatteryReadings,
  getLatestReading,
};
