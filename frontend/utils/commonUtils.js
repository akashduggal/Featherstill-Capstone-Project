export const formatBmsPayload = (rawData) => {
  const cell_mv = Array.isArray(rawData?.cell_mv) ? rawData.cell_mv : [];
  const cellVoltages = cell_mv.map((v) => v / 1000);

  const minCellVoltage = cellVoltages.length ? Math.min(...cellVoltages) : 0;
  const maxCellVoltage = cellVoltages.length ? Math.max(...cellVoltages) : 0;

  const currentAmps = (rawData?.current_ma || 0) / 1000;

  return {
    nominalVoltage: 51.2, // Hardcoded standard
    capacityWh: 5222,     // Hardcoded standard
    minCellVoltage,
    maxCellVoltage,
    totalBatteryVoltage: (rawData?.pack_total_mv || 0) / 1000,
    cellTemperature: (rawData?.temp_ts1_c_x100 || 0) / 100,
    currentAmps,
    outputVoltage: (rawData?.pack_ld_mv || 0) / 1000,
    stateOfCharge: rawData?.soc || 0,
    
    chargingStatus: currentAmps > 0 ? "CHARGING" : "INACTIVE",
    cellVoltages,
  };
}; 