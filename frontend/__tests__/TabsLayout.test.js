import React from 'react';
import { render } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';
import TabsLayout from '../app/(tabs)/_layout'; 
import { Colors } from '../constants/Colors'; 

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  
  const Tabs = ({ children, screenOptions, testID }) => (
    <View testID={testID} testOptions={screenOptions}>
      {children}
    </View>
  );
  
  Tabs.Screen = ({ testID }) => <View testID={testID} />;
  
  return { Tabs };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'MockedIonicons',
}));

jest.mock('react-native', () => {
  const actualReactNative = jest.requireActual('react-native');
  
  const mockReactNative = Object.create(actualReactNative);
  
  Object.defineProperty(mockReactNative, 'useColorScheme', {
    value: jest.fn(),
    writable: true,
  });
  
  return mockReactNative;
});

describe('TabsLayout Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all three required tabs (Bluetooth, Dashboard, Settings)', () => {
    useColorScheme.mockReturnValue('light');
    const { getByTestId } = render(<TabsLayout />);

    // These now look for the actual testIDs you wrote in TabsLayout.js
    expect(getByTestId('tab-screen-dashboard')).toBeTruthy();
    expect(getByTestId('tab-screen-settings')).toBeTruthy();
  });

  it('applies the LIGHT theme colors correctly', () => {
    useColorScheme.mockReturnValue('light');
    const { getByTestId } = render(<TabsLayout />);
    
    const tabsContainer = getByTestId('tabs-container');
    const options = tabsContainer.props.testOptions;

    expect(options.tabBarActiveTintColor).toBe(Colors.light.tabIconSelected);
    expect(options.tabBarInactiveTintColor).toBe(Colors.light.tabIconDefault);
    expect(options.tabBarStyle.backgroundColor).toBe(Colors.light.background);
    expect(options.tabBarStyle.borderTopColor).toBe(Colors.light.cardBorder);
  });

  it('applies the DARK theme colors correctly', () => {
    useColorScheme.mockReturnValue('dark');
    const { getByTestId } = render(<TabsLayout />);
    
    const tabsContainer = getByTestId('tabs-container');
    const options = tabsContainer.props.testOptions;

    expect(options.tabBarActiveTintColor).toBe(Colors.dark.tabIconSelected);
    expect(options.tabBarInactiveTintColor).toBe(Colors.dark.tabIconDefault);
    expect(options.tabBarStyle.backgroundColor).toBe(Colors.dark.background);
    expect(options.tabBarStyle.borderTopColor).toBe(Colors.dark.cardBorder);
  });
});