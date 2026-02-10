
This guide sets up the ESP-IDF environment on **macOS** and flashes a simple
Embedded-C program to an ESP32 (CP2102) that:
- prints `ESP32 connected via CP2102!`
- blinks GPIO2 every 1 second

---

## 1. Install ESP-IDF (Environment Setup)

### 1.1 Download and install
Download **ESP-IDF Tools Installer for macOS** from Espressif and install it.
(It installs ESP-IDF, Python, toolchains, and drivers.)

After installation, **open a new Terminal**.

---

### 1.2 Enable ESP-IDF environment

Run:
```bash
. $HOME/esp/esp-idf/export.sh

### 1.3 Connect the Board

### 1.4 Create ESP-IDF Project

mkdir -p ~/esp/projects
cd ~/esp/projects
idf.py create-project esp32_blink
cd esp32_blink

### 1.5 Set Target Chip

idf.py set-target esp32

### 1.6 Build

idf.py build

### 1.7 Flash to board and Monitor Output

idf.py -p /dev/cu.SLAB_USBtoUART flash monitor
