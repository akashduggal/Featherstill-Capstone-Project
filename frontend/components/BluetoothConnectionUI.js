import React, { useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, FlatList, PermissionsAndroid, Platform, StyleSheet, ActivityIndicator, TouchableOpacity, Text, useColorScheme } from 'react-native';
import { BLEContext } from '../context/BLEContext';
import { Typography } from './Typography';
import { Button } from './Button';
import { SettingsDropdown } from './SettingsDropdown';
import { Modal } from './Modal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

async function requestPermissions() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    if (
      granted['android.permission.BLUETOOTH_SCAN'] !== 'granted' ||
      granted['android.permission.BLUETOOTH_CONNECT'] !== 'granted' ||
      granted['android.permission.ACCESS_FINE_LOCATION'] !== 'granted'
    ) {
      console.log('Some Bluetooth permissions denied');
    }
  }
}

export const BluetoothConnectionUI = () => {
  const {
    devices,
    scanForDevices,
    connectToDevice,
    isScanning,
    previouslyConnectedDevices,
  } = useContext(BLEContext);
  const router = useRouter();
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [hasScanned, setHasScanned] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const getBleErrorUserMessage = (error) => {
    if (!error || !error.reason) {
      return 'An unknown error occurred. Please try again.';
    }

    if (error.reason.includes('status 133') || error.reason.includes('GATT_ERROR')) {
      return 'Connection failed. Please ensure the device is nearby, turned on, and not connected to another application.';
    }

    if (error.reason.toLowerCase().includes('was disconnected')) {
      return 'The device disconnected unexpectedly. Please try connecting again.';
    }

    return 'Could not connect to the device. Please try again.';
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const handleConnect = (device) => {
    setIsConnecting(true);
    connectToDevice(
      device,
      () => {
        setIsConnecting(false);
        router.push('/dashboard');
      },
      (error) => {
        setIsConnecting(false);
        setModalMessage(getBleErrorUserMessage(error));
        setModalVisible(true);
      }
    );
  };

  const renderItem = ({ item }) => {
    const isAlreadyPaired = previouslyConnectedDevices.some(d => d.name === item.name);

    return (
      <View style={[styles.devCard, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        <View style={styles.devRow}>
          <Text style={[styles.devName, { color: colors.text }]}>{item.name}</Text>
          
          {isAlreadyPaired ? (
            <View style={[styles.devPaired, { backgroundColor: colors.accent + '20' }]}>
               <Text style={[styles.devPairedText, { color: colors.accentLight }]}>Paired</Text>
            </View>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={[styles.devConnectBtn, { backgroundColor: colors.accent }]}
              onPress={() => handleConnect(item)}
              disabled={isConnecting}
            >
              {isConnecting ? (
                 <ActivityIndicator size="small" color="#fff" />
              ) : (
                 <Text style={styles.devConnectText}>Connect</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const deviceOptions = previouslyConnectedDevices.map(d => d.name);

  const handleScan = () => {
    setHasScanned(true);
    scanForDevices();
  };

  const filteredDevices = devices.filter(device => device.name && device.name.includes('ESP32_'));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {previouslyConnectedDevices.length > 0 && (
        <View style={styles.dropdownSection}>
           <SettingsDropdown
            label="Connected Modules List"
            colors={colors}
            options={deviceOptions}
            selectedIndex={selectedDeviceIndex}
            onSelect={setSelectedDeviceIndex}
          />
          <TouchableOpacity 
             style={[styles.scanBtn, { backgroundColor: colors.accent, marginTop: 8 }]} 
             activeOpacity={0.8} 
             onPress={() => {
                const selectedDevice = previouslyConnectedDevices[selectedDeviceIndex];
                handleConnect(selectedDevice);
             }}
             disabled={isConnecting}
          >
             {isConnecting ? (
                <ActivityIndicator size="small" color="#fff" />
             ) : (
                <Text style={[styles.scanBtnText, { color: '#fff' }]}>Connect</Text>
             )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.dividerContainer}>
        <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
        <Text style={[styles.dividerText, { color: colors.icon }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.cardBorder }]} />
      </View>

      <TouchableOpacity 
         style={[styles.scanBtn, { backgroundColor: isScanning ? colors.cardBorder : colors.accent }]} 
         activeOpacity={0.8} 
         onPress={handleScan} 
         disabled={isScanning}
      >
         {isScanning ? (
            <ActivityIndicator size="small" color={colors.text} />
         ) : (
             <Text style={[styles.scanBtnText, { color: isScanning ? colors.text : '#fff' }]}>
                {isScanning ? 'Scanning...' : 'Scan for New Modules'}
             </Text>
         )}
      </TouchableOpacity>

      <View style={styles.listSection}>
        {hasScanned && (
          <Text style={[styles.listLabel, { color: colors.text }]}>
            Scanned Devices ({filteredDevices.length})
          </Text>
        )}
        
        <FlatList
          data={filteredDevices}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            hasScanned && !isScanning ? (
              <View style={styles.emptyState}>
                <Ionicons name="bluetooth-outline" size={48} color={colors.cardBorder} />
                <Text style={[styles.emptyText, { color: colors.icon }]}>No new ESP32 modules found nearby.</Text>
              </View>
            ) : null
          }
        />
      </View>

      <Modal
        visible={modalVisible}
        title="Connection Failed"
        message={modalMessage}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  screenSubtitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownSection: {
    marginBottom: 8,
  },
  mainConnectButton: {
    marginTop: 16,
    borderRadius: 12,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  scanBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  listSection: {
    flex: 1,
  },
  listLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  devCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  devName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  devConnectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devConnectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  devPaired: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  devPairedText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});
