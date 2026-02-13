# Sprint 1 Hardware Verification Report

## 1. #37 Discovery Validation
* **Goal**: Confirm the ESP32 is visible to external BLE clients.
* **Result**: Verified using the nRF Connect mobile app.
* **Evidence**: The device successfully advertises with the name "ESP32_STEP1" and the 128-bit Service UUID aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee0.

## 2. #38 Notification Testing
* **Goal**: Confirm the mock_sender_task successfully pushes data.
* **Result**: Upon subscribing to the characteristic ...e1, the client receives a 43-byte battery_log_t packet every 1000ms.
* **Evidence**: Serial logs confirm: BATT_MOCK: LIVE notify=1 followed by successful notification pushes.

## 3. #41 Stability & Performance Evaluation
* **Goal**: Ensure the NimBLE stack handles connections without crashing.
* **Result**: The system maintained a stable connection for a continuous 30-minute test period.
* **Metric**: Observed a consistent 1 Hz update frequency with 0% packet drop during the test window.
* **Technical Note**: The use of the NimBLE stack resulted in low memory overhead, keeping the heap stable during active notifications.
