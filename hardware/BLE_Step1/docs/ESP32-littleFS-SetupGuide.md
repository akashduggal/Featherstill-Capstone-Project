# ESP32 LittleFS Setup Guide (ESP-IDF v5.x)

## 1. Add Dependency

```bash
idf.py add-dependency joltwallet/littlefs
```

## 2. Create `partitions.csv`

Place in project root:

```
# Name,   Type, SubType, Offset,  Size
nvs,      data, nvs,     0x9000,  0x5000
otadata,  data, ota,     0xe000,  0x2000
phy_init, data, phy,     0x10000, 0x1000
factory,  app,  factory, 0x20000, 1M
littlefs, data, littlefs,,       256K
```

## 3. Enable Custom Partition Table

```bash
idf.py menuconfig
```

Navigate to **Partition Table → Partition Table → Custom partition table CSV** and set the filename to `partitions.csv`.



## 4. Build & Flash

Delete the build folder if you changed partitions, then:

```bash
idf.py build
idf.py flash monitor
```
