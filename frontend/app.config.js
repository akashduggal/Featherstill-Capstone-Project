
const fetherstillConfig = {
  owner: 'fetherstill',
  name: 'fetherstill',
  slug: 'fetherstill',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'Fetherstill',
  plugins: [
    'expo-router',
    '@react-native-google-signin/google-signin',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
    'react-native-ble-plx',
    'expo-sqlite',
    './plugins/withIosFirebaseFix.js',
  ],
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0F172A',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.fetherstill.app',
    googleServicesFile: './GoogleService-Info.plist',
    buildNumber: '1',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSBluetoothPeripheralUsageDescription:
        'This app uses Bluetooth to connect to and communicate with your Featherstill battery module.',
      NSBluetoothAlwaysUsageDescription:
        'This app uses Bluetooth to find, connect and interact with your Featherstill battery module.',
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    package: 'com.fetherstill.app',
    googleServicesFile: './google-services.json',
    versionCode: 1,
    permissions: [
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    router: {},
    eas: {
      projectId: '453d94d5-285f-408c-8a98-522d3767fb3b',
    },
  },
};

export default ({ config }) => {
  const isDevelopment = process.env.APP_ENV === 'development';
  const isPreview = process.env.APP_ENV === 'preview';

  const devConfig = {
    name: 'fetherstill (Dev)',
    ios: {
      ...fetherstillConfig.ios,
      bundleIdentifier: 'com.fetherstill.app.dev',
    },
    android: {
      ...fetherstillConfig.android,
      package: 'com.fetherstill.app.dev',
    },
  };

  const previewConfig = {
    name: 'fetherstill (Preview)',
    ios: {
      ...fetherstillConfig.ios,
      bundleIdentifier: 'com.fetherstill.app.preview',
    },
    android: {
      ...fetherstillConfig.android,
      package: 'com.fetherstill.app.preview',
    },
  };

  let extraConfig = {};
  if (isDevelopment) {
    extraConfig = devConfig;
  } else if (isPreview) {
    extraConfig = previewConfig;
  }

  return {
    ...config,
    ...fetherstillConfig,
    ...extraConfig,
  };
};
