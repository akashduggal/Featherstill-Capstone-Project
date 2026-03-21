# BLE OTA Protocol Definition

This document defines the BLE protocol for Over-the-Air (OTA) firmware updates for the ESP32 device.

## OTA Service

- **Service UUID**: `f0000000-0000-4000-8000-000000000001`

## Characteristics

### 1. OTA Control Characteristic

- **UUID**: `f0000000-0000-4000-8000-000000000002`
- **Properties**: Write
- **Purpose**: Used by the mobile app to send control commands to the ESP32.

#### Commands

- **`0x01`: Start OTA**
  - **Description**: Initiates the OTA process.
  - **Payload**:
    - `firmware_size` (4 bytes, `uint32_t`, little-endian): Total size of the firmware binary in bytes.
    - `firmware_md5` (16 bytes, `byte[]`): MD5 checksum of the firmware binary for verification.

- **`0x02`: End OTA**
  - **Description**: Sent by the app after the entire firmware has been transferred.
  - **Payload**:
    - `success` (1 byte, `uint8_t`): `1` if the app confirms the transfer is complete, `0` otherwise.

- **`0x03`: Abort OTA**
  - **Description**: Cancels the OTA process.
  - **Payload**: None.

### 2. OTA Data Characteristic

- **UUID**: `f0000000-0000-4000-8000-000000000003`
- **Properties**: Write Without Response
- **Purpose**: For transferring the firmware binary in chunks.
- **Payload**: Raw binary data of the firmware chunk.

### 3. OTA Status Characteristic

- **UUID**: `f0000000-0000-4000-8000-000000000004`
- **Properties**: Notify
- **Purpose**: For the ESP32 to send status updates to the app.

#### Notifications

- **`0x01`: Ready for OTA**
  - **Description**: ESP32 is prepared and waiting for firmware data.
  - **Payload**: None.

- **`0x02`: Chunk Received**
  - **Description**: Confirms receipt of a firmware chunk.
  - **Payload**:
    - `chunk_index` (4 bytes, `uint32_t`, little-endian): The index of the chunk that was received.

- **`0x03`: OTA Complete**
  - **Description**: Firmware successfully received and verified. The device will now reboot.
  - **Payload**: None.

- **`0x04`: OTA Error**
  - **Description**: An error occurred during the OTA process.
  - **Payload**:
    - `error_code` (1 byte, `uint8_t`): A code indicating the error type.

## Command Sequence

1.  **Connection**: The app connects to the ESP32 device.
2.  **Discovery**: The app discovers the OTA service and its characteristics.
3.  **Subscription**: The app subscribes to notifications on the **OTA Status** characteristic.
4.  **Start**: The app sends the **Start OTA** command (`0x01`) to the **OTA Control** characteristic, including the firmware size and MD5 checksum.
5.  **Confirmation**: The ESP32 validates the request, prepares for the update, and sends a **Ready for OTA** notification (`0x01`).
6.  **Data Transfer**: The app begins sending firmware chunks to the **OTA Data** characteristic.
7.  **Progress Tracking**: For each chunk received, the ESP32 sends a **Chunk Received** notification (`0x02`).
8.  **End**: After all chunks are sent, the app sends the **End OTA** command (`0x02`).
9.  **Verification & Reboot**: The ESP32 verifies the firmware. On success, it sends an **OTA Complete** notification (`0x03`) and reboots. On failure, it sends an **OTA Error** notification (`0x04`).
