const validateBatteryReading = (data) => {
  const errors = [];

  // Validate email
  if (!data.email || typeof data.email !== 'string') {
    errors.push('Invalid or missing email');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email format is invalid');
  }

  // Validate batteryId
  if (!data.batteryId || typeof data.batteryId !== 'string') {
    errors.push('Invalid or missing batteryId');
  }

  // Validate totalBatteryVoltage
  if (
    typeof data.totalBatteryVoltage !== 'number' ||
    data.totalBatteryVoltage < 0 ||
    data.totalBatteryVoltage > 100
  ) {
    errors.push('totalBatteryVoltage must be a number between 0 and 100');
  }

  // Validate cellTemperature
  if (
    typeof data.cellTemperature !== 'number' ||
    data.cellTemperature < -50 ||
    data.cellTemperature > 85
  ) {
    errors.push('cellTemperature must be a number between -50 and 85');
  }

  // Validate currentAmps
  if (typeof data.currentAmps !== 'number') {
    errors.push('currentAmps must be a number');
  }

  // Validate stateOfCharge
  if (
    typeof data.stateOfCharge !== 'number' ||
    data.stateOfCharge < 0 ||
    data.stateOfCharge > 100
  ) {
    errors.push('stateOfCharge must be a number between 0 and 100');
  }

  // Validate chargingStatus
  const validStatuses = ['CHARGING', 'DISCHARGING', 'INACTIVE'];
  if (
    data.chargingStatus &&
    !validStatuses.includes(data.chargingStatus)
  ) {
    errors.push(
      `chargingStatus must be one of: ${validStatuses.join(', ')}`
    );
  }

  // Validate cellVoltages (should be array of numbers)
  if (data.cellVoltages && !Array.isArray(data.cellVoltages)) {
    errors.push('cellVoltages must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateBatteryReading,
};
