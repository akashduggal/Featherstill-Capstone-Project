# Hardware Setup Guide

**Component**: ESP32 BLE Battery Monitoring System  
**Directory**: `hardware/BLE_Step1/`

---

## Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Pin Configuration](#pin-configuration)
3. [Assembly Instructions](#assembly-instructions)
4. [Sensor Calibration](#sensor-calibration)
5. [Testing & Verification](#testing-and-verification)
6. [Troubleshooting](#troubleshooting)

---

## Hardware Requirements

### Microcontroller

| Specification | Value | Notes |
|---------------|-------|-------|
| **Model** | ESP32-D0WDQ5 or ESP32-D0WDH | Dual-core variant recommended |
| **Operating Voltage** | 3.0V - 3.6V | Use 3.3V regulated supply |
| **Frequency** | 240 MHz | Dual core for optimal performance |
| **Flash Memory** | 4 MB minimum | Required for OTA updates |
| **SRAM** | 520 KB SRAM | Internal working memory |
| **GPIO Pins** | 34 | For sensor and peripheral connections |
| **ADC Channels** | 8 channels (12-bit) | For voltage/current measurements |
| **I2C/SPI** | 2 each | For temperature sensor communication |
| **UART** | 3 serial ports | Serial logging and configuration |
| **BLE** | Built-in stack | Version 5.0 support |

### Power Supply

```
Input Voltage: 5V or 12V (external source)
Regulated Output: 3.3V @ 1A minimum
Surge Protection: TVS diode (5V1 or 6V8)
Capacitors: 
  - 10µF electrolytic (input)
  - 100nF ceramic (bypass near ESP32)
  - 100nF ceramic (near sensors)
```

### Voltage Measurement Sensor

| Specification | Value | Notes |
|---------------|-------|-------|
| **Type** | Series voltage divider with ADC | Built-in ESP32 ADC |
| **Range** | 0-4096 mV internal | Configure for 0-60V battery |
| **Divider Ratio** | 1:15 (15kΩ/1kΩ) | For ~60V max input |
| **Accuracy** | ±0.1V typical | After calibration |
| **Sampling Rate** | 1-1000 Hz configurable | Default: 10 Hz |
| **Resolution** | 12-bit | ~14.6 mV per LSB |

**Voltage Divider Circuit**:
```
Battery+ (Vmax)
    |
    R1 (15kΩ)
    |----[To ADC Pin]
    R2 (1kΩ)
    |
  GND
```

### Current Measurement Sensor

| Specification | Value | Notes |
|---------------|-------|-------|
| **Type** | Hall-effect or shunt resistor | INA219 I2C recommended |
| **Range** | ±200A typical | Depends on sensor choice |
| **Accuracy** | ±2% after calibration | Validated in production |
| **Output** | I2C digital (0x40 address) | Easy integration |
| **Response Time** | < 1ms | For dynamic monitoring |
| **Operating Voltage** | 3.3V or 5V | Sensor dependent |

**INA219 I2C Connection**:
```
PIN | INA219 | ESP32
----|--------|------
SCL |  SCL   | GPIO22
SDA |  SDA   | GPIO21
GND |  GND   | GND
VCC |  VIN+  | 3.3V
A0  |  A0    | GND (address 0x40)
```

### Temperature Sensor

| Specification | Value | Notes |
|---------------|-------|-------|
| **Type** | I2C/SPI thermistor OR IC sensor | DHT22 or BMP280 |
| **Range** | -40°C to +85°C | Full operating range |
| **Accuracy** | ±1°C typical | After calibration |
| **Response Time** | < 1 second | Warm-up required |
| **Interface** | I2C or 1-Wire | I2C recommended |
| **Operating Voltage** | 3.3V | Direct to ESP32 |

**I2C Temperature Sensor (BMP280)**:
```
PIN | BMP280 | ESP32
----|--------|------
SCL |  SCL   | GPIO22
SDA |  SDA   | GPIO21
GND |  GND   | GND
VCC |  VCC   | 3.3V
CSB |  CSB   | 3.3V (for I2C mode)
```

### Additional Components

| Component | Quantity | Purpose |
|-----------|----------|---------|
| Decoupling Capacitor (100nF) | 3-4 | Power supply noise filtering |
| Electrolytic Cap (10µF) | 1 | Input power smoothing |
| Pull-up Resistor (10kΩ) | 2 | I2C lines (if needed) |
| Reset Button | 1 | GPIO0/RESET control |
| Programming Header | 1 | UART for serial flashing |
| LED (status indicator) | 1 | Visual feedback (GPIO5) |
| Crystal Oscillator | 1 | 32.768 kHz (optional, on-board) |

---

## Pin Configuration

### ESP32 Pinout Reference

```
                    ┌─────────────────┐
                    │  ESP32-D0WDQ5   │
                    │   (Top View)    │
        GND    GND  │ 1            38 │  3.3V
        GPIO3  U0RX │ 2            37 │  EN
        GPIO1  U0TX │ 3            36 │  SENSOR_VP
       GPIO22  SCL  │ 4            35 │  SENSOR_VN
       GPIO21  SDA  │ 5            34 │  GPIO34 (ADC_BATT)
       GPIO19  MISO │ 6            33 │  GPIO33 (STATUS_LED)
       GPIO23  MOSI │ 7            32 │  GPIO32
        GPIO5  LED  │ 8            31 │  GPIO31
       GPIO18  SCK  │ 9            30 │  GPIO30
        GPIO4  TS4  │10            29 │  GPIO29
       GPIO2   IOEXP│11            28 │  GPIO28
       GPIO15  MOSI │12            27 │  GPIO27
       GPIO8   D1   │13            26 │  GPIO26
       GPIO7   D0   │14            25 │  GPIO25
       GPIO6   CLK  │15            24 │  GPIO24
       EN/RST       │16            23 │  GPIO13
        GND         │17            22 │  GND
       3.3V         │18            21 │  GND
                    └─────────────────┘
```

### Assigned Pins

| GPIO | Purpose | Function | Notes |
|------|---------|----------|-------|
| **GPIO21** | SDA | I2C Data line | Temperature/Current sensor |
| **GPIO22** | SCL | I2C Clock line | Temperature/Current sensor |
| **GPIO33** | LED_Status | Status LED | Green=OK, Red=Error |
| **GPIO34** | ADC_Battery | Voltage input | Analog, read-only |
| **GPIO5** | LED_Debug | Debug LED | Optional indicator |
| **GPIO4** | TS4 | Touch sensor 4 | Optional |
| **GPIO2** | GPIO2 | General I/O | Reserved |
| **GPIO18** | SCK | SPI Clock | Optional |
| **GPIO23** | MOSI | SPI Data out | Optional |
| **GPIO19** | MISO | SPI Data in | Optional |
| **GPIO0** | BOOT | Boot mode | Hold low to flash |

### I2C Address Map

| Device | I2C Address | GPIO Connection |
|--------|-------------|-----------------|
| **INA219 (Current)** | 0x40 | SCL=GPIO22, SDA=GPIO21 |
| **BMP280 (Temperature)** | 0x77 | SCL=GPIO22, SDA=GPIO21 |
| **Optional EEPROM** | 0x50 | SCL=GPIO22, SDA=GPIO21 |

---

## Assembly Instructions

### Step 1: Prepare ESP32 Development Board

**Tools Required**:
- Soldering iron (25W, 350°C)
- Solder (lead-free, 0.5mm)
- Wire strippers
- Multimeter
- Breadboard (for prototyping)

**Components**:
- ESP32-D0WDQ5 with header pins
- Breadboard or custom PCB

**Instructions**:

1. **Solder header pins** to ESP32 (if not factory-installed)
   - Place ESP32 flat on board
   - Insert header pins into pads
   - Solder each connection cleanly
   - Inspect for cold solder joints

2. **Visual inspection**:
   - Check for no bridges between pins
   - Verify all pins have silver solder joints
   - Remove excess solder with desoldering wick

### Step 2: Install Power Supply

```
5V Input ─┬─ [Fuse 1A] ─┬─ [Diode 1N4007] ─ VCC (+)
          │             │
          ├─ [C1 10µF] ─┴─ [C2 100nF] ─── GND
          │
         GND
```

**Steps**:

1. Connect power supply to breadboard rails
   - Red wire → VCC (3.3V)
   - Black wire → GND

2. Install decoupling capacitors
   - Place 100nF ceramic near ESP32 VCC pin
   - Place 10µF electrolytic on input
   - Verify polarity before powering

3. Test voltage output
   ```bash
   Multimeter reading: Should show 3.3V ±0.1V
   ```

### Step 3: Install Current Sensor (INA219)

```
          ┌──────────────┐
          │    INA219    │
    SCL ──┤1  Addr  38  VCC├── 3.3V
    SDA ──┤2  SCL   37   VIN├── Battery+
    GND ──┤3  SDA   36   GND├── GND
    3.3V ┤4  VCC   35   OUT├── To Shunt
          └──────────────┘
```

**Steps**:

1. Mount INA219 on breadboard
2. Connect I2C lines:
   - SCL → GPIO22
   - SDA → GPIO21
3. Connect power:
   - VCC → 3.3V
   - GND → GND
4. Connect current sense:
   - IN+ → Battery positive
   - IN- → Shunt resistor (0.1Ω, 1W)
   - Shunt- → Ground

### Step 4: Install Voltage Divider

```
Battery+ (0-60V)
    |
    ├─ R1 [15kΩ]
    |
    ├─────────── GPIO34 (ADC)
    |
    ├─ R2 [1kΩ]
    |
   GND
```

**Steps**:

1. Calculate resistor values for desired range:
   ```
   Ratio = (R1 + R2) / R2
   For 60V max: Ratio = 15
   Use: R1 = 15kΩ, R2 = 1kΩ
   ```

2. Build divider on breadboard
3. Connect tap point to GPIO34
4. Verify with multimeter:
   - At 0V input: ADC reads ~0V
   - At max battery: ADC reads ~3.3V

### Step 5: Install Temperature Sensor (BMP280)

```
    ┌──────────────┐
    │   BMP280     │
SCL │ SCL       VCC │ 3.3V
SDA │ SDA       GND │ GND
VCC │ VCC           │
GND │ GND           │
CSB │ CSB(3.3V)     │ (I2C mode)
    └──────────────┘
```

**Steps**:

1. Mount BMP280 on breadboard
2. Connect I2C:
   - SCL → GPIO22 (shared with INA219)
   - SDA → GPIO21 (shared with INA219)
3. Connect power:
   - VCC → 3.3V via 100nF cap
   - GND → GND
4. Set I2C mode:
   - Connect CSB to 3.3V (forces I2C mode)
   - If SDO pin exists, connect to GND for addr 0x77

### Step 6: Install Status LED

```
ESP32 GPIO33 ─────[1kΩ resistor]─────┌─ LED ─┐
                                       │ GND   │
                                       └───────┘
```

**Steps**:

1. Connect 1kΩ resistor to GPIO33
2. Connect LED positive through resistor
3. Connect LED negative to GND
4. Verify with code:
   ```c
   gpio_set_level(GPIO_NUM_33, 1);  // LED ON
   ```

### Step 7: Connect Serial Programming Header

```
ESP32 UART0          USB-Serial Adapter
───────────────────────────────────
GPIO1  (TX)    ──────── RX
GPIO3  (RX)    ──────── TX
GND            ──────── GND
```

**Steps**:

1. Install USB-to-Serial adapter
2. Connect three wires:
   - TX (GPIO1) → RX
   - RX (GPIO3) → TX
   - GND → GND
3. Install CH340 or similar driver
4. Test connection: `idf.py monitor`

### Final Assembly

```
┌─────────────────────────────────┐
│      ESP32 Board                │
│  ┌─────────────────────────┐    │
│  │   ESP32 Chip    3.3V ○  │    │
│  │                 GND ○   │    │
│  │   GPIO21 (SDA)  ○       │    │
│  │   GPIO22 (SCL)  ○       │    │
│  │   GPIO33 (LED)  ○────┐  │    │
│  │   GPIO34 (ADC)  ○◄───┤  │    │
│  │                       │  │    │
│  └─────────────────────────┘    │
│         │         │       │      │
│      I2C Bus   Voltage   LED     │
│      (Sensors) Divider          │
└─────────────────────────────────┘
        │
    ┌───┴───┐
    │ Batt  │
    │Monitor│
    └───────┘
```

---

## Sensor Calibration

### Voltage Sensor Calibration

**Tools Needed**:
- Multimeter
- Power supply (0-60V capable)
- Resistive load (optional)

**Procedure**:

1. **Connect reference measurement**:
   - Connect multimeter in parallel with battery
   - Note the voltage reading

2. **Read ADC value**:
   ```bash
   idf.py monitor
   # Serial output shows: "Battery Voltage: XXX.X V (ADC: YYYY)"
   ```

3. **Create calibration table** (at least 3 points):

   | Reference (V) | ADC Reading | Ratio (V/ADC) |
   |---|---|---|
   | 10.0 | 1200 | 0.00833 |
   | 30.0 | 3600 | 0.00833 |
   | 50.0 | 6000 | 0.00833 |

4. **Apply calibration formula**:
   ```c
   #define ADC_OFFSET 0
   #define ADC_SCALE 0.00833  // V per ADC unit
   
   float voltage = (adc_reading - ADC_OFFSET) * ADC_SCALE;
   ```

5. **Verify accuracy**:
   - Test at multiple voltages
   - Error should be ±0.1V or better

6. **Store calibration** in NVS:
   ```bash
   nvs_set_f32(handle, "voltage_scale", 0.00833);
   nvs_set_i32(handle, "voltage_offset", 0);
   ```

### Current Sensor Calibration (INA219)

**Tools Needed**:
- Power supply
- Precision resistor (0.1Ω, 1%)
- Multimeter
- Variable load

**Procedure**:

1. **Verify shunt resistor** (0.1Ω nominal):
   ```bash
   Multimeter resistance: Should read 0.1Ω ±1%
   ```

2. **No-load test**:
   ```bash
   # Disconnect load
   idf.py monitor
   # Current should read ~0A ±0.05A
   ```

3. **Apply known current**:
   - Use precision resistor or power supply
   - Load = V / R (e.g., 12V / 0.1Ω = 120A)
   - Record INA219 reading

4. **Create calibration points**:

   | Applied Current (A) | INA219 Reading (A) | Error |
   |---|---|---|
   | 1 | 1.02 | +2% |
   | 10 | 10.1 | +1% |
   | 50 | 50.2 | +0.4% |

5. **Adjust calibration** if needed:
   ```c
   // INA219 has internal calibration register
   ina219_calibrate(32768);  // 0.1Ω shunt
   ```

6. **Store in NVS** for persistence

### Temperature Sensor Calibration

**Tools Needed**:
- Ice bath (0°C)
- Boiling water (100°C)
- Thermometer reference
- Multimeter

**Procedure**:

1. **Room temperature baseline**:
   - Record BMP280 reading
   - Record multimeter temperature reading
   - Note at 20°C: Sensor=20.1°C

2. **Ice bath test** (0°C):
   - Place sensor in ice water
   - Wait 5 minutes for stabilization
   - Read both sensors
   - Record offset if any

3. **Boiling water test** (100°C):
   - Place sensor in boiling water
   - Wait for stabilization
   - Compare readings

4. **Calculate correction**:
   ```c
   float temp_corrected = temp_raw + offset;
   // If sensor reads 2°C high: offset = -2.0
   ```

5. **Store in NVS**:
   ```bash
   nvs_set_f32(handle, "temp_offset", -2.0);
   ```

6. **Verify over range**:
   - Test at room temp
   - Test at 10°C (refrigerator)
   - Test at 40°C (warm environment)

---

## Testing & Verification

### Power-On Test

1. **Connect USB power** (5V)
2. **Observe LEDs**:
   - ✅ Green LED flashing = OK
   - ❌ Red LED = Error detected
   - ❌ No LED = Power issue

3. **Check serial output**:
   ```bash
   idf.py -p COM3 monitor
   
   # Expected output:
   I (100) boot: ESP-IDF v5.5.2
   I (150) BLE_OTA: BLE OTA Firmware v1.0.0
   I (200) SENSOR: Battery Voltage: 48.5V
   I (250) SENSOR: Battery Current: 12.3A
   I (300) SENSOR: Temperature: 25.5°C
   ```

### Voltage Measurement Verification

```bash
# Compare with multimeter
1. Connect multimeter to battery terminals
2. Check idf.py monitor output
3. Verify readings match (±0.1V acceptable)

Multimeter: 48.52V
Monitor: 48.50V ✅ (within tolerance)
```

### Current Measurement Verification

```bash
# With known load
1. Connect 12Ω resistor load to battery
2. Calculate expected current: 48V / 12Ω = 4A
3. Check monitor reading
4. Verify within ±2%

Expected: 4.0A
Measured: 4.04A ✅ (within tolerance)
```

### Temperature Measurement Verification

```bash
# Compare with known temperature
1. Place sensor in water bath at known temp (e.g., 25°C)
2. Wait 2 minutes for stabilization
3. Check monitor reading
4. Verify ±1°C accuracy

Room Temp: 24.8°C
Sensor: 25.1°C ✅ (within tolerance)
```

### BLE Connectivity Test

```bash
1. Build and flash firmware
2. Open mobile app
3. Scan for devices
4. Verify "Featherstill" appears
5. Attempt pairing
6. Confirm data reception

Expected: ✅ Device visible and paired
Data flowing: ✅ Real-time updates received
```

### OTA Update Test

1. **Prepare OTA binary**:
   ```bash
   idf.py build
   # Binary location: build/BLE_Step1.ota.bin
   ```

2. **Start OTA from mobile app**:
   - Tap "Settings" → "Firmware Update"
   - Select binary file
   - Start update

3. **Monitor progress**:
   ```bash
   idf.py -p COM3 monitor
   # Look for: "OTA progress: XX%"
   ```

4. **Verify reboot**:
   - Device should restart automatically
   - New version should be reported

---

## Troubleshooting

### Power Issues

**Problem**: No LED lights, device not responsive

| Symptom | Cause | Solution |
|---------|-------|----------|
| No 5V input | Power disconnected | Check USB cable, PSU |
| 5V present, no 3.3V | LDO failure | Measure LDO output, replace if needed |
| 3.3V low (<3.0V) | Overcurrent | Disconnect sensors, test individually |
| Voltage unstable | Capacitor issue | Replace bypass capacitors |

**Diagnostic**:
```bash
# Test with multimeter
5V input: Should measure 5.0V ±0.1V
3.3V rail: Should measure 3.3V ±0.1V
GND continuity: Should be 0Ω between all GND pins
```

### Serial Connection Problems

**Problem**: `pyserial.SerialException: Could not open port COM3`

| Solution | Steps |
|----------|-------|
| Check USB driver | Install CH340 driver from manufacturer |
| Verify COM port | Device Manager → Ports → Find ESP32 |
| Try different cable | Use known-good USB cable |
| Hold GPIO0 low | While plugging in for boot mode |

**Diagnostic**:
```bash
# List available ports
mode COM:  # Windows - shows available ports
ls /dev/tty*  # Linux

# Try specific port
idf.py -p COM3 monitor
```

### Voltage Measurement Issues

**Problem**: ADC readings unstable or incorrect

| Symptom | Cause | Solution |
|---------|-------|----------|
| Always reads 0V | Divider not connected | Check GPIO34 connection to divider tap |
| Reads max (4096) | Open circuit | Verify resistor continuity |
| Drifts over time | Capacitor noise | Add 100nF cap between GPIO34 and GND |
| ±10% error | Divider ratio wrong | Recalculate R1/R2 values |

**Diagnostic**:
```bash
# Measure with multimeter
At resistor tap: Should be 3.3V * (R2/(R1+R2)) = ~0.22V at 60V battery

# Check in firmware
Excessive noise indicates: Shorted pin or missing bypass cap
```

### Current Sensor Issues

**Problem**: INA219 not responding or wrong readings

| Symptom | Cause | Solution |
|---------|-------|----------|
| No I2C communication | Wrong address or SCL/SDA | Check pins, verify addr jumper |
| Reads 0A always | Shunt resistor missing | Install 0.1Ω 1W resistor |
| Unstable readings | Poor contacts or noise | Add 100nF bypass cap near sensor |
| Drifts over time | Temperature variation | Perform thermal calibration |

**Diagnostic**:
```bash
# I2C scanner test
i2cdetect -y 1  # Linux

# Should show: 40 (INA219 address)
# If missing: Check wiring, I2C pull-ups
```

### Temperature Sensor Issues

**Problem**: Temperature reading incorrect or not updating

| Symptom | Cause | Solution |
|---------|-------|----------|
| Always reads -40°C | Sensor not responding | Check BMP280 address and I2C connection |
| Reads room temp only | Sensor stuck | Power cycle, check SDA/SCL |
| Off by 5°C or more | Not calibrated | Perform calibration procedure |
| Updates very slowly | Filter set too high | Increase sampling rate in code |

**Diagnostic**:
```bash
# Check sensor address
# BMP280 default: 0x77 (with SDO=GND)
# If SDO=3.3V: use address 0x76

# Manual test in menuconfig
idf.py menuconfig
# Component config → ESP-IDF → Enable sensors
```

### BLE Connection Issues

**Problem**: Device not appearing in app scan

| Symptom | Cause | Solution |
|---------|-------|----------|
| Never advertises | BLE disabled in menuconfig | Enable in: Component config → Bluetooth |
| Intermittent visibility | Advertisement interval too long | Set to 100-200ms |
| App can't connect | Pairing key mismatch | Unpair and re-pair device |
| Connection drops often | Interference or distance | Move closer, reduce obstacles |

**Diagnostic**:
```bash
# Build with BLE debugging
idf.py -DCMAKE_BUILD_TYPE=Debug build

# Monitor BLE events
idf.py monitor filter ble_ota
```

### OTA Update Failures

**Problem**: Update hangs or fails mid-transfer

| Symptom | Cause | Solution |
|---------|-------|----------|
| Transfer stalls at 50% | Bad connection | Retry with device closer |
| CRC error on completion | Corrupted transfer | Check binary file integrity |
| Won't boot after update | Bad firmware signature | Verify binary with correct signing key |

**Recovery**:
```bash
# Erase and reflash bootloader
idf.py -p COM3 erase_flash

# Flash previous firmware
idf.py -p COM3 flash --bin firmware-v0.9.0.bin
```

---

## Component Datasheets & References

- [ESP32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- [INA219 Datasheet](https://www.ti.com/lit/ds/symlink/ina219.pdf)
- [BMP280 Datasheet](https://www.bosch-sensortec.com/bst/products/all_products/bmp280)
- [ESP-IDF Documentation](https://docs.espressif.com/projects/esp-idf/)

---

## Support

- 📖 [BUILD_PROCESS.md](./BUILD_PROCESS.md) - Firmware compilation
- 📖 [VERSION_MANAGEMENT.md](./VERSION_MANAGEMENT.md) - Version tracking
- 🐛 [Report Issue](https://github.com/akashduggal/Featherstill-Capstone-Project/issues)

---

**Last Updated**: April 17, 2026  
**Document Version**: 1.0.0
