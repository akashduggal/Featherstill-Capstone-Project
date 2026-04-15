# Firmware Build Process Documentation

## Table of Contents
1. [Build Environment Setup](#build-environment-setup)
2. [Dependencies & Tools](#dependencies--tools)
3. [Build Commands](#build-commands)
4. [Troubleshooting](#troubleshooting)

---

## Build Environment Setup

### Prerequisites
- **Operating System**: Windows, macOS, or Linux
- **ESP-IDF Version**: 5.5.2 or compatible
- **Target**: ESP32 microcontroller

### Step 1: Install ESP-IDF

#### Windows
```bash
# Download ESP-IDF installer (v5.5.2)
# From: https://github.com/espressif/esp-idf/releases

# Or clone from GitHub
git clone --branch v5.5.2 https://github.com/espressif/esp-idf.git
cd esp-idf
./install.bat
```

#### macOS/Linux
```bash
git clone --branch v5.5.2 https://github.com/espressif/esp-idf.git
cd esp-idf
./install.sh
```

### Step 2: Set Environment Variables

#### Windows (PowerShell)
```powershell
$env:IDF_PATH = "C:\path\to\esp-idf"
$env:PATH += ";$env:IDF_PATH\tools"
```

#### macOS/Linux (Bash)
```bash
export IDF_PATH=~/esp-idf
export PATH="$IDF_PATH/tools:$PATH"
source $IDF_PATH/export.sh
```

### Step 3: Install Build Tools

The following tools must be available in your PATH:
- **CMake** (version 3.16 or later)
- **Python 3.7+** with pip
- **ESP-IDF tools**: Downloaded during `idf_tools.py install`

### Step 4: Set Serial Port (Optional but Recommended)

#### Windows (PowerShell)
```powershell
$env:ESPPORT = "COM3"  # Replace with your ESP32 port
```

#### macOS/Linux (Bash)
```bash
export ESPPORT=/dev/ttyUSB0  # or /dev/tty.usbserial-* on macOS
```

---

## Dependencies & Tools

### Core Dependencies

| Dependency | Version | Purpose | Source |
|------------|---------|---------|--------|
| **ESP-IDF** | 5.5.2 | IoT development framework | Espressif |
| **littlefs** | 1.20.4 | Filesystem component | joltwallet/littlefs |
| **CMake** | 3.16+ | Build system | CMake official |
| **Python** | 3.7+ | Build scripting | Python official |
| **GCC Toolchain** | xtensa-esp32 | Compiler | Espressif Tools |

### Project Configuration

#### SDKConfig
Located at: `sdkconfig`
- Contains ESP-IDF configuration options
- Includes BLE stack configuration
- OTA partition settings
- Serial communication parameters

#### Partition Table
Located at: `partitions.csv`
```
# Name,   Type, SubType, Offset,  Size, Flags
nvs,      data, nvs,     0x9000,  0x6000,
phy_init, data, phy,     0xf000,  0x1000,
factory,  app,  factory, 0x10000, 0xF0000,
ota_0,    app,  ota_0,   0x100000, 0xF0000,
ota_1,    app,  ota_1,   0x1F0000, 0xF0000,
ota_data, data, ota,     0x2E0000, 0x2000,
```

### Required Tools Installation Check

```bash
# Verify ESP-IDF installation
idf.py --version

# Verify Python packages
pip list | grep esptool

# Verify CMake
cmake --version

# List available ESP32 ports
idf.py monitor --port list
```

---

## Build Commands

### Build Steps

#### Step 1: Clean Build (Recommended for first-time setup)
```bash
cd /path/to/BLE_Step1
idf.py fullclean
```

#### Step 2: Configure Project
```bash
idf.py set-target esp32
idf.py menuconfig
```
This opens the configuration menu where you can adjust:
- BLE settings
- OTA configuration
- Serial port baud rate
- Memory allocation

#### Step 3: Build Firmware
```bash
idf.py build
```

**Output**: Generates firmware binaries in `build/` directory

### Complete Build & Flash Process

```bash
# One-command build and flash
idf.py -p COM3 build flash monitor

# Build only (no flash)
idf.py build

# Flash only (use existing binary)
idf.py -p COM3 flash

# Monitor serial output
idf.py -p COM3 monitor
```

### Build Output Files

| File | Location | Purpose |
|------|----------|---------|
| **Firmware Binary** | `build/bootloader/bootloader.bin` | Second stage bootloader |
| **App Binary** | `build/BLE_Step1.bin` | Main application firmware |
| **Partition Table** | `build/partition_table/partition-table.bin` | ESP32 partition layout |
| **OTA Binary** | `build/BLE_Step1.ota.bin` | OTA update package |

### Build Environment Variables

```bash
# Set baud rate (default: 115200)
export ESPBAUD=230400

# Set monitoring filter
export MONITOR_FILTER="tag_string_filter"

# Disable color output
export MONITOR_NO_COLOR=1
```

### Advanced Build Options

```bash
# Build with verbose output
idf.py -v build

# Build specific component
idf.py build -DCOMPONENT=ble_ota

# Build with custom compiler flags
idf.py build -- -DCONFIG_CUSTOM_FLAG=value

# Generate build information
idf.py build info
```

---

## Troubleshooting

### 1. ESP-IDF Not Found

**Error**: `IDF_PATH environment variable not set`

**Solution**:
```bash
# Windows (PowerShell)
$env:IDF_PATH = "C:\esp-idf"
./esp-idf/install.bat
./esp-idf/export.bat

# Linux/macOS
export IDF_PATH=~/esp-idf
source $IDF_PATH/export.sh
```

### 2. Python Packages Missing

**Error**: `ModuleNotFoundError: No module named 'idf_component_tools'`

**Solution**:
```bash
pip install --upgrade idf-component-tools
pip install -r $IDF_PATH/requirements.txt
```

### 3. CMake Version Too Old

**Error**: `CMake 3.5 or higher is required`

**Solution**:
```bash
# Update CMake
# Windows: Download from https://cmake.org/download/
# macOS: brew install cmake
# Linux: apt-get install cmake (or equivalent)
cmake --version  # Verify version >= 3.16
```

### 4. Serial Port Not Found

**Error**: `No port specified. Try -p or ESPPORT`

**Solution**:
```bash
# List available ports
idf.py monitor --port list

# Set port explicitly
idf.py -p /dev/ttyUSB0 flash monitor  # Linux
idf.py -p COM3 flash monitor           # Windows
idf.py -p /dev/tty.usbserial build     # macOS
```

### 5. Build Fails with Memory Issues

**Error**: `PSRAM access before initialization`

**Solution**:
```bash
# Adjust in menuconfig
idf.py menuconfig
# Navigate to: Component config → ESP32-specific → Memory organization

# Or run fullclean and rebuild
idf.py fullclean
idf.py build
```

### 6. Upload Timeout

**Error**: `serial.serialutil.SerialTimeoutException`

**Solution**:
```bash
# Increase baud rate or reduce it
export ESPBAUD=115200  # Slower for reliability
idf.py -p COM3 -b 115200 flash

# Or check USB cable/connection
# Try different USB port
```

### 7. OTA Partition Issues

**Error**: `Failed to write OTA data`

**Solution**:
```bash
# Erase entire flash and reprogram
idf.py -p COM3 erase_flash
idf.py -p COM3 flash monitor

# Verify partition table
idf.py read_partition_table
```

### 8. BLE Stack Compilation Errors

**Error**: `undefined reference to 'ble_hs_start'`

**Solution**:
```bash
# Ensure BLE component is enabled in menuconfig
idf.py menuconfig
# Navigate to: Component config → Bluetooth → Bluetooth core

# Rebuild
idf.py build
```

### 9. Dependency Lock Issues

**Error**: `Failed to resolve dependencies`

**Solution**:
```bash
# Update dependencies
idf.py reconsider-manifest-file

# Reinstall components
rm -rf managed_components/
idf.py build
```

### 10. Monitor Shows Garbage Output

**Error**: `garbled serial output`

**Solution**:
```bash
# Check baud rate matches sdkconfig (default: 115200)
idf.py -p COM3 -b 115200 monitor

# Reset ESP32
# Press RST button on board

# Or erase and reflash
idf.py -p COM3 erase_flash
idf.py -p COM3 flash monitor
```

---

## Quick Reference

### Typical Development Workflow

```bash
# 1. First setup
cd BLE_Step1
idf.py set-target esp32
idf.py menuconfig

# 2. Build and flash
idf.py build
idf.py -p COM3 flash monitor

# 3. Subsequent builds
idf.py build
idf.py -p COM3 flash --no-stub

# 4. Just monitor logs
idf.py -p COM3 monitor

# 5. Clean for fresh build
idf.py fullclean
idf.py build
```

### Essential Keyboard Shortcuts (Monitor)

| Key | Action |
|-----|--------|
| `Ctrl+]` | Exit monitor |
| `Ctrl+T` | Send 'R' to reset ESP32 |
| `Ctrl+C` | Interrupt running program |

---

## References

- [ESP-IDF Documentation](https://docs.espressif.com/projects/esp-idf/en/v5.5.2/)
- [ESP32 Technical Reference](https://www.espressif.com/en/products/socs/esp32)
- [littlefs Component](https://components.espressif.com/components/joltwallet/littlefs)
- [OTA Updates in ESP-IDF](https://docs.espressif.com/projects/esp-idf/en/v5.5.2/esp32/api-reference/system/ota_updates.html)

---

## Support

For build issues not covered here:
1. Check ESP-IDF logs: `build/CMakeFiles/CMakeOutput.log`
2. Enable verbose build: `idf.py -v build`
3. Check official ESP-IDF GitHub issues
4. Consult Espressif technical forum
