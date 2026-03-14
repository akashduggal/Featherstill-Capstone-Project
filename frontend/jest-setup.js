
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'), { virtual: true });

require('react-native-reanimated').setUpTests();
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(),
  })),
}));

jest.mock('react-native-ble-plx', () => {
  return {
    BleManager: jest.fn().mockImplementation(() => ({
      startDeviceScan: jest.fn(),
      stopDeviceScan: jest.fn(),
      connectToDevice: jest.fn(),
      discoverAllServicesAndCharacteristicsForDevice: jest.fn(),
      readCharacteristicForDevice: jest.fn(),
      monitorCharacteristicForDevice: jest.fn(),
      destroy: jest.fn(),
    })),
  };
});

jest.mock('@react-native-firebase/auth', () => () => ({
  signInWithCredential: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  currentUser: { uid: 'test-user-123' },
}));