# ESP32 Environment Setup (macOS)

This document describes the **one-time setup** required to program ESP32 boards on macOS using Arduino IDE.

---

## 1) Connect ESP32
- Connect the ESP32 to your Mac using a **data-capable USB cable**.
- The power LED should turn ON.
- If no LED turns ON, try a different cable.

---

## 2) Verify serial device detection
Open Terminal and run:

```bash
ls /dev/cu.*

You should see a device such as:

/dev/cu.SLAB_USBtoUART
/dev/cu.wchusbserial
/dev/cu.usbserial-*
/dev/cu.usbmodem*

## 3) Install USB-to-UART driver
Most ESP32 boards require a USB-to-UART driver to be detected by macOS.

Common USB chips used on ESP32 boards:
- CP2102

Download and install the CP210x driver from Silicon Labs:
https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers

After installation:
- Restart macOS
- Reconnect the ESP32
- Verify the device appears using:

```bash
ls /dev/cu.*

## 4) Install Arduino IDE
Download and install Arduino IDE from:

https://www.arduino.cc/en/software


## 5) Add ESP32 board support to Arduino IDE

- Open Arduino IDE → Preferences
- Add the following URL to Additional Board Manager URLs:

https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json

- Open:
	Tools → Board → Boards Manager
	Search for esp32
	Install esp32 by Espressif Systems

## 5) Select board and port

- Tools → Board → ESP32 Arduino → ESP32 Dev Module

- Tools → Port → /dev/cu.usb…
