const validateBatteryReading = (data) => {
  const errors = [];

  // helper to coerce numeric-like strings to numbers
  const toNumber = (v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
    return undefined;
  };

  const email = data && data.email;
  const batteryId = data && data.batteryId;
  const totalBatteryVoltage = toNumber(data && data.totalBatteryVoltage);
  const cellTemperature = toNumber(data && data.cellTemperature);
  const currentAmps = toNumber(data && data.currentAmps);
  const stateOfCharge = toNumber(data && data.stateOfCharge);
  const chargingStatus = data && data.chargingStatus;
  const cellVoltages = data && data.cellVoltages;

  // Validate email
  if (!email || typeof email !== 'string') {
    errors.push('Invalid or missing email');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email format is invalid');
  }

  // Validate batteryId
  if (!batteryId || typeof batteryId !== 'string') {
    errors.push('Invalid or missing batteryId');
  }

  // Validate totalBatteryVoltage
  if (totalBatteryVoltage === undefined || typeof totalBatteryVoltage !== 'number' || totalBatteryVoltage < 0 || totalBatteryVoltage > 1000) {
    errors.push('totalBatteryVoltage must be a number between 0 and 1000');
  }

  // Validate cellTemperature
  if (cellTemperature === undefined || typeof cellTemperature !== 'number' || cellTemperature < -500 || cellTemperature > 1250) {
    errors.push('cellTemperature must be a number between -500 and 1250');
  }

  // Validate currentAmps
  if (currentAmps === undefined || typeof currentAmps !== 'number') {
    errors.push('currentAmps must be a number');
  }

  // Validate stateOfCharge
  if (stateOfCharge === undefined || typeof stateOfCharge !== 'number' || stateOfCharge < 0 || stateOfCharge > 1000) {
    errors.push('stateOfCharge must be a number between 0 and 1000');
  }

  // Validate chargingStatus
  const validStatuses = ['CHARGING', 'DISCHARGING', 'INACTIVE'];
  if (chargingStatus && !validStatuses.includes(chargingStatus)) {
    errors.push(`chargingStatus must be one of: ${validStatuses.join(', ')}`);
  }

  // Validate cellVoltages (should be array of numbers)
  if (cellVoltages && !Array.isArray(cellVoltages)) {
    errors.push('cellVoltages must be an array');
  } else if (Array.isArray(cellVoltages)) {
    for (let i = 0; i < cellVoltages.length; i += 1) {
      if (toNumber(cellVoltages[i]) === undefined) {
        errors.push(`cellVoltages[${i}] must be a number`);
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateBatteryReading,
};
