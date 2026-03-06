# TP-172: End-to-End Resume Test Proof

    Related Task: #172
    Parent Feature: #161 Hardware – Stable Sequence-Based Streaming
    Component: ESP32 BLE Battery Logger

# Summary

    This document records the proof that end-to-end resume behavior was tested for sequence-based backlog streaming on the ESP32 BLE Battery Logger.

The goal of this testing was to verify that backlog transfer:

1. starts from the correct record

2. resumes correctly from a requested sequence number

3. behaves safely across disconnects

4. supports abort during transfer

5. does not let stale abort state break future transfers

# Test Setup

Hardware

    ESP32 running BLE Battery Logger firmware

Tools

    nRF Connect

    Serial monitor

Relevant BLE characteristics

    CMD for backlog control

    BACKLOG for notify-based backlog transfer

Supported commands

    01 → request full backlog

    01 <seq_le32> → request backlog starting from sequence

    03 → abort active backlog

# Proof 1: Full Backlog Request Works
Action

    Connected to the device in nRF Connect, enabled notifications on the BACKLOG characteristic, and wrote:

01
Observed Behavior

    The device began backlog transfer from the beginning of the stored log.

Expected Behavior

    Backlog should begin at the oldest stored record.

Result

    Pass

Proof Notes

    Observed serial output matched expected full backlog behavior, with transfer starting at index 0 and continuing oldest to newest.

observed pattern:

    BACKLOG: start count=515 start_idx=0
    BACKLOG: done

# Proof 2: Resume From Specific Sequence Works
Action

    Sent a backlog request using sequence-based resume format.

Example used:

    01 E8 03 00 00

    This corresponds to sequence 1000.

Observed Behavior

    The device parsed the request correctly and began backlog transfer from the first record whose sequence number was equal to 1000.

Expected Behavior

    The first transmitted record should satisfy:

    record.seq >= requested_seq

observed pattern:

    BACKLOG: start count=1515 start_idx=1000
    BACKLOG: done

Result

    Pass

Proof Notes

This confirmed that the new command format:

    01 E8 03 00 00

    was accepted and used correctly.

# Proof 3: Resume Start Index Logic Works
Action

    Requested backlog from a chosen sequence number that already existed in flash.

Observed Behavior

    Backlog started from the matching sequence position rather than restarting from the beginning.

Expected Behavior

    The firmware should identify the first log record where:

    seq >= requested_seq

    and start streaming from that index.

observed pattern:

    BACKLOG: start count=2015 start_idx=1500
    BACKLOG: done

Result

    Pass

Proof Notes

    This validates the sequence-based start-index lookup behavior required for resume support.

# Proof 4: Disconnect During Backlog Is Safe
Action

    Started backlog transfer, then disconnected during the transfer.

Observed Behavior

    The transfer stopped safely when the connection ended.

Expected Behavior

    No crash, no corrupt state, and no continued attempts to notify after disconnect.

Result

    Pass

Proof Notes

    The device remained stable after disconnect and was able to accept future connections.

# Proof 5: Abort During Active Backlog Works
Action

    Started a backlog transfer and then sent:

    03

    during active sending.

Observed Behavior

    The transfer stopped during the send loop after the abort signal was detected.

Expected Behavior

    Abort should stop the currently active backlog transfer.

Result

    Pass

Proof Notes

    Abort handling worked correctly when backlog was actively being transmitted.

# Proof 6: Stale Abort No Longer Breaks Future Transfers
Action

    Reviewed and fixed the case where an abort flag could remain latched and incorrectly affect the next backlog request.

A clear was added before beginning backlog send:

    ble_backlog_clear_abort();

Observed Behavior

    After this change, a new backlog transfer no longer aborted immediately because of stale abort state from an earlier session.

Expected Behavior

    Each new backlog send should start with a clean abort state.

Result

    Pass

Proof Notes

    This fix addressed the case where the next backlog transfer could terminate immediately at the first iteration because of an earlier abort signal.



Commands Used During Testing
1. Full backlog
    01
2. Resume from sequence 1000
    01 E8 03 00 00
3. Resume from sequence 1500
    01 DC 05 00 00
4. Abort active backlog
    03


# Conclusion

    Testing confirmed that the ESP32 BLE Battery Logger supports end-to-end sequence-based resume behavior for backlog streaming.

    The following behaviors were verified:

    full backlog request works

    resume from sequence works

    start index selection works correctly

    disconnect during transfer is handled safely

    abort during active transfer works

    stale abort state no longer breaks future transfers

# Overall result: Task #172 verified successfully.