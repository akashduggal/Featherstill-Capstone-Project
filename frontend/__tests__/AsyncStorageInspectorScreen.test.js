import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AsyncStorageInspectorScreen from '../app/asyncStorageInspector'; 

jest.mock('@react-native-async-storage/async-storage', () => ({
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  clear: jest.fn(),
}));

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null, 
  },
}));

describe('AsyncStorageInspectorScreen', () => {
  const alertSpy = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    AsyncStorage.getAllKeys.mockImplementation(() => new Promise(() => {}));
    
    const { getByTestId, queryByText } = render(<AsyncStorageInspectorScreen />);
    
    expect(queryByText('No data found in AsyncStorage.')).toBeNull();
  });

  it('renders empty state correctly when storage is empty', async () => {
    AsyncStorage.getAllKeys.mockResolvedValue([]);
    AsyncStorage.multiGet.mockResolvedValue([]);

    const { getByText } = render(<AsyncStorageInspectorScreen />);

    await waitFor(() => {
      expect(getByText('No data found in AsyncStorage.')).toBeTruthy();
    });
  });

  it('renders keys and formats values correctly', async () => {
    const mockKeys = ['firebase:token', 'previouslyConnectedDevices'];
    const mockMultiGetResult = [
      ['firebase:token', 'abc-123-xyz'],
      ['previouslyConnectedDevices', '[{"id":"ESP_1"}]']
    ];

    AsyncStorage.getAllKeys.mockResolvedValue(mockKeys);
    AsyncStorage.multiGet.mockResolvedValue(mockMultiGetResult);

    const { getByText } = render(<AsyncStorageInspectorScreen />);

    await waitFor(() => {
      expect(getByText('firebase:token')).toBeTruthy();
      expect(getByText('previouslyConnectedDevices')).toBeTruthy();

      expect(getByText('abc-123-xyz')).toBeTruthy();

      const parsed = JSON.parse('[{"id":"ESP_1"}]');
      expect(getByText(JSON.stringify(parsed, null, 2))).toBeTruthy();
    });
  });

  it('handles empty strings and nulls safely in formatting', async () => {
    const mockKeys = ['emptyKey', 'nullKey'];
    const mockMultiGetResult = [
      ['emptyKey', ''],
      ['nullKey', null]
    ];

    AsyncStorage.getAllKeys.mockResolvedValue(mockKeys);
    AsyncStorage.multiGet.mockResolvedValue(mockMultiGetResult);

    const { getByText } = render(<AsyncStorageInspectorScreen />);

    await waitFor(() => {
      expect(getByText('"" (Empty String)')).toBeTruthy();
      expect(getByText('null')).toBeTruthy();
    });
  });

  it('shows confirmation alert when Clear All Storage is pressed', async () => {
    AsyncStorage.getAllKeys.mockResolvedValue([]);
    AsyncStorage.multiGet.mockResolvedValue([]);

    const { getByText } = render(<AsyncStorageInspectorScreen />);

    await waitFor(() => expect(AsyncStorage.getAllKeys).toHaveBeenCalled());

    const clearButton = getByText('Clear All Storage');
    fireEvent.press(clearButton);

    expect(alertSpy).toHaveBeenCalledWith(
      'Clear Async Storage',
      'Are you sure you want to wipe all local keys?',
      expect.any(Array) 
    );

    expect(AsyncStorage.clear).not.toHaveBeenCalled();
  });

  it('executes clear and refreshes data when Wipe Data is confirmed', async () => {
    AsyncStorage.getAllKeys.mockResolvedValue(['someKey']);
    AsyncStorage.multiGet.mockResolvedValue([['someKey', 'someValue']]);

    const { getByText } = render(<AsyncStorageInspectorScreen />);

    await waitFor(() => expect(AsyncStorage.getAllKeys).toHaveBeenCalledTimes(1));

    fireEvent.press(getByText('Clear All Storage'));

    const buttons = alertSpy.mock.calls[0][2];
    const wipeButton = buttons.find(b => b.text === 'Wipe Data');
    
    await wipeButton.onPress();

    expect(AsyncStorage.clear).toHaveBeenCalledTimes(1);
    
    expect(AsyncStorage.getAllKeys).toHaveBeenCalledTimes(2);
  });
});