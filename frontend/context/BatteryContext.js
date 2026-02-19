import React, { createContext, useState, useContext } from 'react';
import { Battery } from '../models/Battery';

const BatteryContext = createContext({
  activeBattery: null,
  isConnected: false,
  connect: async () => {},
  disconnect: async () => {},
  refreshData: async () => {},
});

export const useBattery = () => useContext(BatteryContext);

export const BatteryProvider = ({ children }) => {
  const [activeBattery, setActiveBattery] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async (deviceId) => {
    // TODO: Implement BLE connection logic here
    console.log(`Connecting to device ${deviceId}...`);
    setIsConnected(true);
    
    // Mock initial data
    setActiveBattery(new Battery({
      id: deviceId || 'mock-device-001',
      name: 'Main ESP32 Battery',
      voltage: 12.4,
      chargeLevel: 85,
      cycleCount: 42,
      health: 98,
      status: 'discharging'
    }));
  };

  const disconnect = async () => {
    // TODO: Implement BLE disconnect
    setIsConnected(false);
    if (activeBattery) {
      // Update status to disconnected but keep last known data
      const updated = new Battery({ ...activeBattery, status: 'disconnected' });
      setActiveBattery(updated);
    }
  };

  const refreshData = async () => {
    if (!isConnected || !activeBattery) return;
    
    // Simulate reading new data
    const newVoltage = activeBattery.voltage - 0.1;
    const newCharge = activeBattery.chargeLevel - 1;
    
    const updated = new Battery({
      ...activeBattery,
      voltage: parseFloat(newVoltage.toFixed(2)),
      chargeLevel: Math.max(0, newCharge),
      lastUpdated: new Date()
    });
    
    setActiveBattery(updated);
  };

  return (
    <BatteryContext.Provider value={{ activeBattery, isConnected, connect, disconnect, refreshData }}>
      {children}
    </BatteryContext.Provider>
  );
};
