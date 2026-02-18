import struct

FMT = "<I16H3H3hB"   # total 49 bytes
# timestamp, 16 cells, 3 pack uint16s, 3 int16s, soc

def decode(payload: bytes):
    vals = struct.unpack(FMT, payload)
    print(vals)
    ts = vals[0]
    cells = vals[1:17]
    pack_total, pack_ld, pack_sum_active = vals[17:20]
    current_ma, temp_ts1_x100, temp_int_x100 = vals[20:23]
    soc = vals[23]

    return {
        "timestamp_s": ts,
        "cell_mv": list(cells),
        "pack_total_mv": pack_total,
        "pack_ld_mv": pack_ld,
        "pack_sum_active_mv": pack_sum_active,
        "current_ma": current_ma,
        "temp_ts1_c": temp_ts1_x100 / 100.0,
        "temp_int_c": temp_int_x100 / 100.0,
        "soc": soc,
    }
hex_string = " BA-00-00-00-FB-0F-FA-0F-FD-0F-FC-0F-0E-10-FD-0F-08-10-00-10-04-10-48-0F-52-0F-51-0F-45-0F-61-0F-61-0F-55-0F-21-F5-F1-F4-21-F5-BB-F1-A4-10-8E-0F-17"
payload = bytes.fromhex(hex_string.replace("-", " "))
print(decode(payload))

{'timestamp_s': 22, 'cell_mv': [3802, 3793, 3775, 3793, 3791, 3800, 3784, 3777, 3788, 3646, 3651, 3646, 3637, 3636, 3647, 3653], 'pack_total_mv': 58352, 'pack_ld_mv': 58280, 'pack_sum_active_mv': 58352, 'current_ma': -1173, 'temp_ts1_c': 37.1, 'temp_int_c': 21.33, 'soc': 85}