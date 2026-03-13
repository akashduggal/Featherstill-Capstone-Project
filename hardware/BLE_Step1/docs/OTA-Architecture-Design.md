# OTA (Over-The-Air) Update Architecture & Design


**Purpose:** Design document for BLE-based OTA firmware updates on Featherstill ESP32 device  
**Scope:** Complete OTA system including infrastructure, initialization, data transmission, and finalization

---

## Table of Contents
1. [What is OTA?](#what-is-ota)
2. [OTA Fundamentals](#ota-fundamentals)
3. [Our System Architecture](#our-system-architecture)
4. [OTA Workflow](#ota-workflow)
5. [State Machine Design](#state-machine-design)
6. [BLE OTA Protocol](#ble-ota-protocol)
7. [OTA Chunk Reception & Flash Write Pipeline](#ota-chunk-reception--flash-write-pipeline)
8. [OTA Completion & Partition Switch](#ota-completion--partition-switch)
9. [OTA Abort & Error Cleanup](#ota-abort--error-cleanup)
10. [Boot Validation & Persistence](#boot-validation--persistence)
11. [File Structure & Partitions](#file-structure--partitions)
12. [Integration Points](#integration-points)
13. [Error Handling & Recovery](#error-handling--recovery)
14. [End-to-End Test Plan](#end-to-end-test-plan)

---

## What is OTA?

**Over-The-Air (OTA) Update** = remotely updating device firmware without physical access.

### Traditional (Non-OTA) Firmware Update
Developer connects via USB cable to device, erasing and rewriting flash memory. **Problem:** Requires physical connection to each device in the field.

### OTA Firmware Update
Developer pushes update to cloud/server, which delivers firmware via BLE/WiFi to device for smart flash rewrite. **Benefit:** Update thousands of devices remotely (firmware, config, or data).

---

## OTA Fundamentals

### Key Concepts

| Concept | Meaning |
|---------|---------|
| **Firmware Image** | Compiled binary (`.bin` file) of the application code |
| **Partition Table** | Divides flash memory into regions (bootloader, active app, OTA staging, etc.) |
| **OTA Partition** | Temporary storage area where new firmware is received before validation |
| **Rollback** | If new firmware fails, device automatically boots old firmware |
| **Validation** | Checksum/signature check to ensure firmware integrity during transfer |
| **Atomic Swap** | Safely switch from old to new firmware; never leaves device in half-upgraded state |

### Why Partitions Matter

ESP32 has limited flash (typically 4MB). We need to partition it intelligently into regions for:
- **Bootloader** (16 KB) — Fixed, loaded at power-on
- **Partition Table** (4 KB) — Defines all flash regions
- **App Active** (1.5 MB) — Currently running firmware
- **OTA Staging** (1.5 MB) — Receives new firmware during update
- **LittleFS Data** (1 MB) — Battery logs, persistent config
- **NVS** (512 KB) — Persistent key-value storage (flags, versions)

---

## Our System Architecture

### Hardware & Technology Stack

| Component | Purpose |
|-----------|---------|
| **ESP32** | Main microcontroller with BLE & OTA support |
| **BLE (Bluetooth Low Energy)** | Wireless communication channel for OTA updates |
| **LittleFS** | File system for battery logs (preserved during OTA) |
| **NVS Flash** | Persistent key-value storage (boot flags, version info) |

### OTA Update Flow (High-Level)

```
┌─────────────┐
│   Phone     │
│  App/Tool   │
└──────┬──────┘
       │
       │ BLE: OTA Start Cmd + Image Chunks
       ▼
┌──────────────────────────────┐
│  Featherstill ESP32 Device   │
│  (Currently Running v1.0)    │
├──────────────────────────────┤
│                              │
│  1. Receive OTA Start Cmd    │
│     ↓                        │
│  2. Transition to OTA State  │
│     ↓                        │
│  3. Receive Image Chunks     │
│     (stored in OTA partition)│
│     ↓                        │
│  4. Validate Image           │
│     (checksum, signature)    │
│     ↓                        │
│  5. Mark OTA Complete        │
│     ↓                        │
│  6. Reboot                   │
│     ↓                        │
│  7. Bootloader Detects OTA   │
│     ↓                        │
│  8. Swap Partitions          │
│  (App ↔ OTA Staging)         │
│     ↓                        │
│  9. Boot Into v2.0           │
│     ▼                        │
│  Successfully Updated!       │
└──────────────────────────────┘
```

---

## OTA Workflow

### Step-by-Step Update Process

#### **Phase 1: OTA Discovery & Initialization**
Client connects to BLE device, discovers OTA GATT service and characteristics, and reads current firmware version. If available update version is newer, client proceeds to initiation phase. Device advertises BLE name and OTA service UUID, and waits for start command.

#### **Phase 2: OTA Start**
Client sends initialization command with new firmware version, total image size, and CRC32 checksum. Device validates preconditions (sufficient space, version rules), erases OTA partition, transitions to IN_PROGRESS state, and confirms readiness to receive chunks.

#### **Phase 3: Image Transfer**
Client sends image data in sequential chunks, each with checksum. Device validates each chunk (sequence, CRC), writes to flash at correct offset, and acknowledges receipt. Status updates are sent to client showing transfer progress. Failed chunk validation triggers retransmit request.

#### **Phase 4: OTA Complete & Validation**
Client signals completion. Device verifies total image size matches expected value, calculates full image CRC32, and compares with client-provided checksum. If valid, device marks OTA as pending in NVS, responds with success, and triggers reboot countdown. On mismatch, device returns to IDLE state and allows retry.

#### **Phase 5: Reboot & Bootloader Swap**
After countdown, device reboots. Bootloader detects the OTA completion flag in NVS and performs atomic partition swap (old active → backup; OTA partition → active). New firmware boots, reads NVS to confirm update, and resumes normal operation with updated version.

---

## State Machine Design

### OTA Session States

```
State Diagram:

         ┌──────────┐
         │  IDLE    │  Initial state, no OTA in progress
         └────┬─────┘
              │
              │ [OTA Start Cmd Received]
              │ - Validate preconditions
              │ - Erase OTA partition
              │ - Initialize chunk tracker
              ▼
         ┌──────────────────┐
         │  IN_PROGRESS     │  Receiving image chunks
         └────┬──────────┬──┘
              │          │
              │          │ [Timeout / Error / Client Abort]
              │          │ - Clear OTA partition
              │          ▼
    [Complete] │    ┌──────────┐
              │    │ ERROR     │  OTA failed, retry allowed
              │    └─────┬─────┘
              │          │
              │          │ [OTA Start Cmd Again]
              │          → Back to IN_PROGRESS
              │
              │ [All Chunks Received + Validated]
              │ - Compute final CRC32
              │ - Mark OTA pending in NVS
              ▼
         ┌──────────────┐
         │  COMPLETE    │  Ready to reboot
         └──────┬───────┘
                │
                │ [Reboot]
                │ (Bootloader takes over)
                ▼
           [Device Boots
            New Firmware]
```

### State Transitions & Triggers

| From | To | Trigger | Action |
|------|----|---------|---------| 
| IDLE | IN_PROGRESS | OTA Start Cmd + validation OK | Erase OTA partition, init counters |
| IN_PROGRESS | IN_PROGRESS | Chunk received & valid | Write to OTA partition, ACK |
| IN_PROGRESS | COMPLETE | All chunks + final CRC OK | Mark NVS flag, prepare reboot |
| IN_PROGRESS | ERROR | Invalid chunk / timeout / client abort | Clear partition, log error |
| COMPLETE | IDLE | Reboot (bootloader swap done) | Resume normal operation |
| ERROR | IDLE | Timeout (manual reset) | Clear error state |
| ERROR | IN_PROGRESS | OTA Start Cmd again | Retry OTA |

### State Machine Implementation

The OTA state machine is implemented as a finite state automaton with four states and transitions triggered by commands (Start, Chunk, Complete, Abort). State transitions validate preconditions, update session metadata, and perform actions. The implementation mainsta ins session state and enforces valid transitions—invalid transitions are rejected or ignored as appropriate.

---

## BLE OTA Protocol

### GATT Service Definition

The OTA service exposes multiple GATT characteristics:

- **OTA Control**: Write-readable characteristic for receiving commands (Start, Chunk, Complete, Abort)
- **OTA Data**: Write-only characteristic for receiving image chunks (up to ~512 bytes per write)
- **OTA Status**: Notifiable characteristic for device → client status updates and transfer progress
- **Firmware Version**: Readable characteristic for current device firmware version (major.minor.patch)

Each characteristic will be assigned UUIDs as part of GATT service definition task. Message formats are binary-packed for BLE transport efficiency.

---

## OTA Chunk Reception & Flash Write Pipeline

### Chunk Reception Flow

When a chunk arrives via BLE, the device must:

1. **Parse the BLE message** (from OTA Data characteristic)
   - Extract chunk ID, size, and data
   - Validate message format

2. **Validate chunk integrity**
   - Verify chunk ID matches expected sequence
   - Check chunk CRC/checksum against provided value
   - Reject if out-of-order or corrupted

3. **Write to OTA partition**
   - Calculate flash offset: `offset = chunk_id * chunk_size`
   - Use ESP32 flash API (`esp_partition_write`) to write to OTA partition
   - Handle flash write errors gracefully (retry or abort)

4. **Update running state**
   - Increment `chunks_received` counter
   - Update `bytes_written` total
   - Calculate running CRC32 for final validation
   - Record timestamp for timeout detection

5. **Send ACK back to client**
   - Respond with: `[status, next_chunk_id_expected]`
   - Status: 0x00 = success, 0x01 = CRC error, 0x02 = flash error
   - Enable client to retry or proceed

### Chunk Reception Implementation

When a chunk arrives via BLE, the device parses the message to extract chunk ID, size, and payload. It then validates chunk ID matches expected sequence and verifies chunk integrity via CRC. On validation success, the chunk is written to flash at the correct offset (chunk_id × chunk_size), session state is updated, and a success ACK is returned to the client. CRC mismatch or flash errors return NAK with appropriate error code.

### Flash Write Pipeline Considerations

**Write Alignment:** ESP32 flash requires 4-byte alignment for writes
- Pad chunks to multiples of 4 bytes if necessary
- Track padding in metadata for later validation

**Wear Leveling:** LittleFS/NVS use wear leveling; OTA partition does not
- Multiple writes to same flash address will fail
- Always erase OTA partition before starting OTA (done at start)

**Write Performance:**
- Typical write speed: ~100-200 KB/s
- BLE throughput: ~100 KB/s (both directions)
- Flash writes should not block BLE stack (use interrupt-friendly APIs)

**CRC32 Calculation:**
- Use incremental CRC32 (polynomial 0x04C11DB7)
- Update running CRC as chunks arrive—don't wait for all chunks
- Libraries: `mbedtls_crc32()` or standard `zlib` CRC32

---

## OTA Completion & Partition Switch

### OTA Completion Flow

Once all chunks are received and ACKed, the client sends the OTA Complete command:

1. **Validate total image**
   - Verify `bytes_written == expected_size`
   - Verify `calculated_crc32 == expected_crc32`
   - If mismatch → stay in ERROR state, allow retry

2. **Mark OTA as pending**
   - Write NVS flag: `ota_update_pending = 1`
   - Store OTA partition details (size, CRC, version) in NVS
   - Write "boot validation" marker to OTA partition header

3. **Send completion ACK to client**
   - Status: 0x00 = ready to reboot, 0x01 = validation failed

4. **Trigger reboot countdown**
   - Set timer for 5 seconds (gives client time to disconnect gracefully)
   - Log: `"OTA complete, rebooting in 5 seconds"`

5. **Reboot device**
   - Called via `esp_restart()`
   - Bootloader takes over partition swap

### Bootloader Partition Swap (Hardware)

The ESP32 bootloader performs the actual partition switch on reboot:

```
Before OTA:
  Active Partition (App 0)  ← App firmware v1.0
  OTA Partition (App 1)      ← (unused)
  
After Reboot + Swap:
  Active Partition (App 0)  ← (previous v1.0, now backup)
  OTA Partition (App 1)      ← (now runs as active, v2.0)
  
On next reboot (normal):
  Active Partition (App 0)  ← Still v1.0 (rollback possible if v2.0 fails)
```

**OTA Data Partition (`otadata`)** tracks which partition is active (via boot counter & CRC).

### OTA Completion Implementation

On OTA Complete command, device validates total image size (bytes_written ≠ expected_size → error) and compares full image CRC32 with client-provided value. If valid, OTA completion marker is stored in NVS (flags, image size, CRC, version), success ACK is sent, state transitions to COMPLETE, and a reboot countdown timer is started (typically 5 seconds). This gives the BLE client time to gracefully disconnect before device reboots and bootloader takes over.

### New Firmware Boot Sequence

After reboot and partition swap, the new firmware initialization reads NVS to confirm OTA completion and update status. The OTA completion flag is cleared, and normal device operation resumes. This sequence is safe to repeat across multiple OTA updates without side effects.

---

## OTA Abort & Error Cleanup

### Abort Scenarios

OTA can be aborted by:
1. **Client sending abort command (0x03)** while IN_PROGRESS
2. **Timeout detected** (no chunk for 30 seconds)
3. **Flash write failure** (e.g., partition full)
4. **Client disconnect** without completing transfer

### Abort Cleanup

When abort is triggered (by client command or error condition), device stops any pending reboot timers, erases OTA partition to free space for retry, clears NVS OTA flags, and resets session state to ERROR. This cleanup enables safe retry from the beginning without stale data or partition conflicts.

### Disconnect Cleanup

If BLE client disconnects unexpectedly during OTA IN_PROGRESS state, device records the disconnect timestamp and waits for client to reconnect. A timeout period (typically 60 seconds) allows for network recovery or user reconnect. If timeout expires without reconnection, abort cleanup is triggered automatically, freeing resources and allowing device to accept new OTA attempts.

---

## Boot Validation & Persistence

### Boot-Time Validation

When the device boots after partition switch, NVS is checked for OTA completion flag. If set, the running partition's firmware is validated via CRC32 calculation (useful for detecting flash corruption post-swap). The completion flag is cleared to prevent repeated validation on subsequent boots. Advanced implementations may trigger automatic rollback if CRC validation fails, though this is optional depending on system requirements.

### Persistence across Power Loss

**Scenario:** Device loses power during OTA transfer.

**Recovery:** On reboot, bootloader checks OTA completion flag in NVS. If not set, OTA was incomplete and bootloader does not swap partitions—old firmware remains active. NVS flags are cleared, and device resumes normal operation. Client can retry OTA from the beginning on next connection (OTA partition cleanup occurs at OTA start time). This design ensures device never enters unstable state due to power loss.

---

## End-to-End Test Plan

### Test Environment

- **Device Under Test (DUT):** ESP32 with OTA-capable firmware
- **Test Client:** BLE smartphone app or desktop tool
- **Test Firmware Images:** 
  - v1.0 (baseline)
  - v2.0 (valid OTA target, ~200 KB)
  - v2.1 (intentionally corrupted, for validation testing)

### Test Cases

#### **Test 1: Successful Full OTA Update**
Client connects, reads firmware version (v1.0), and initiates OTA with new image (256 KB). Device accepts all chunks, validates CRC, marks OTA complete in NVS, reboots, bootloader swaps partitions, and new firmware boots. Verification confirms version is 2.0 and battery logs in LittleFS are preserved.

#### **Test 2: Chunk Out-of-Order Handling**
With OTA IN_PROGRESS, client sends chunk #5 when device expects #3. Device rejects out-of-order chunk via NAK response. Client then sends correct chunk #3. Verification confirms device properly validates sequence and continues accepting chunks in correct order.

#### **Test 3: CRC Failure on Single Chunk**
Client sends chunk with corrupted CRC. Device detects mismatch and returns NAK. Client retransmits same chunk (corrected). Device validates and accepts retransmitted chunk. Verification confirms device robustly handles transient corruption and recovers via retransmit. 

#### **Test 4: CRC Failure on Complete Image**
After all chunks received, client sends OTA Complete. Device calculates full image CRC and detects mismatch with expected value. Device returns error response and transitions to ERROR state. Client can retry from OTA Start without device reboot. Verification confirms device rejects invalid complete image and allows retry.

#### **Test 5: Timeout (No Chunk for 30 Seconds)**
Device receives chunks 0–4 normally, then client stops sending (simulate network loss). Device waits for chunk #5 and detects timeout after 30 seconds. Device transitions to ERROR state and clears OTA partition. Verification confirms timeout detection triggers correctly and cleanup frees resources for retry.

#### **Test 6: Client Abort During Transfer**
Device receives chunks 0–50 of 100 (50% complete). Client sends Abort command. Device receives abort, transitions to ERROR state, and clears OTA partition. Verification confirms graceful abort and readiness for new OTA attempt.

#### **Test 7: BLE Disconnect During Transfer**
Device 80% complete. BLE client disconnects abruptly. Device detects disconnect and starts reconnection timer (60 seconds). No reconnect occurs, timeout triggers abort, and OTA partition is cleared. Verification confirms disconnect detection and timeout-based cleanup.

#### **Test 8: Power Loss During Transfer**
Device 40% complete. Simulate power loss. Restore power. Device boots into old firmware (safe partition). NVS ota_pending flag is cleared, and device resumes normal operation. Client can retry OTA on next connection. Verification confirms safe fallback and ability to retry.

#### **Test 9: Version Check (No Downgrade)**
Device running v2.0. Client attempts OTA with v1.5 (downgrade). Device compares versions and rejects OTA Start. Verification confirms version check prevents accidental downgrade.

#### **Test 10: Battery Log Preservation**
Device has 100 battery records before OTA. Perform full successful OTA (v1.0 → v2.0). After reboot, verify battery logs are intact. Verification confirms all 100 records preserved and LittleFS uncorrupted.

### Test Results Checklist

- [ ] Test 1: Successful OTA
- [ ] Test 2: Out-of-order chunk rejection
- [ ] Test 3: Single chunk CRC retry
- [ ] Test 4: Complete image CRC validation
- [ ] Test 5: Timeout handling
- [ ] Test 6: Client abort
- [ ] Test 7: Disconnect handling
- [ ] Test 8: Power loss recovery
- [ ] Test 9: Version validation
- [ ] Test 10: Data preservation

---

## File Structure & Partitions

### Expected Partition Table

Flash memory is organized into multiple partitions:
- **NVS**: Key-value storage for boot flags, OTA metadata, version info
- **otadata**: Tracks which app partition is active (incremental boot counter per partition)
- **app0**: Active firmware partition (~1.25 MB)
- **app1**: OTA staging partition (~1.25 MB, receives new firmware)
- **littlefs**: File system for battery logs and persistent config (~1.4 MB)

OTA data partition (otadata) uses monotonic boot counters to safely track which partition is active after partition swap.

---

## Integration Points

### Files Involved (Current + New)

Core implementation files in `hardware/BLE_Step1/main/`:
- **app_main.c**: OTA task loop integration
- **ble_ota_service.h/.c**: BLE GATT service definition and characteristic handlers
- **ota_session.h/.c**: State machine implementation and session tracking
- **ota_commands.h/.c**: OTA Start command parsing and validation
- **ota_partition.h/.c**: Partition read/write helpers
- **partitions.csv**: Flash partition layout
- **CMakeLists.txt**: Build configuration and OTA component inclusion

Existing ESP-IDF components (already available):
- esp_partition: Low-level partition API
- bootloader: OTA-aware bootloader
- esp_ota_ops: OTA operation helpers

### Existing Code Reuse

- **Battery logging system:** Preserved during OTA (LittleFS partition separate)
- **BLE stack:** Already initialized; OTA adds a new GATT service
- **NVS:** Already used; OTA adds version & pending flags
- **Bootloader:** ESP32 bootloader handles partition swap (no changes needed)

---

## Error Handling & Recovery

### Failure Scenarios

| Scenario | Cause | Recovery |
|----------|-------|----------|
| **Chunk timeout** | Network disconnection | Timeout detection → ERROR state, retry on reconnect |
| **Invalid CRC (chunk)** | Corruption during transfer | Request retransmit up to 3 times |
| **Invalid CRC (full image)** | Total corruption | Mark invalid, return to IDLE, allow retry |
| **Out of space** | OTA partition too small | Reject before start, return error |
| **Power loss during transfer** | User pulls power | Reboot recovers; OTA partition cleared, back to IDLE |
| **Power loss during reboot** | User pulls power during partition swap | Bootloader detects incomplete swap, boots old firmware |
| **Corrupted bootloader** | Rare hardware failure | Device unrecoverable (require reflash via USB) |

### Timeout & Retry Logic

Device maintains timestamp of last received chunk. A periodic check (every ~1 second) compares current time against last chunk time. If no chunk received within timeout window (e.g., 30 seconds per chunk), OTA session transitions to ERROR state, OTA partition is cleared, and device is ready for retry. Client-side can retry by sending new OTA Start command, which reinitializes the session.

---





