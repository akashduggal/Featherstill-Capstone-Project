/**
 * Represents a battery device and its telemetry data.
 */
export class Battery {
  constructor({ 
    id, 
    name = 'Unknown Battery', 
    voltage = 0, 
    chargeLevel = 0, 
    cycleCount = 0, 
    health = 100, 
    status = 'disconnected', 
    lastUpdated = new Date() 
  }) {
    this.id = id;
    this.name = name;
    this.voltage = voltage; // in Volts
    this.chargeLevel = chargeLevel; // percentage (0-100)
    this.cycleCount = cycleCount;
    this.health = health; // percentage (0-100)
    this.status = status; // 'connected', 'disconnected', 'charging', 'discharging'
    this.lastUpdated = lastUpdated;
  }

  get isLowBattery() {
    return this.chargeLevel < 20;
  }

  get isCritical() {
    return this.chargeLevel < 5;
  }

  updateTelemetry({ voltage, chargeLevel, status }) {
    if (voltage !== undefined) this.voltage = voltage;
    if (chargeLevel !== undefined) this.chargeLevel = chargeLevel;
    if (status !== undefined) this.status = status;
    this.lastUpdated = new Date();
  }
}
