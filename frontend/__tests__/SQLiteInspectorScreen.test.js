import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SQLiteInspectorScreen from '../app/sqliteInspector'; 

import { getTelemetry, insertTelemetry, clearAllTelemetry } from '../services/database';
jest.mock('../services/database', () => ({
  getTelemetry: jest.fn(),
  insertTelemetry: jest.fn(),
  clearAllTelemetry: jest.fn(),
}));

jest.mock('../context', () => ({
  useAuth: () => ({
    user: { email: 'tester@featherstill.com' }
  })
}));

jest.mock('../utils/commonUtils', () => ({
  formatBmsPayload: jest.fn((data) => JSON.stringify(data)), 
}));

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null, 
  },
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('SQLiteInspectorScreen', () => {
  const alertSpy = jest.spyOn(Alert, 'alert');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state correctly on initial load', async () => {
    getTelemetry.mockReturnValue([]);

    const { getByText } = render(<SQLiteInspectorScreen />);

    expect(getTelemetry).toHaveBeenCalledTimes(1);
    expect(getByText('No telemetry found in the database.')).toBeTruthy();
    expect(getByText('0 records found')).toBeTruthy();
  });

  it('renders telemetry records with correct badges', async () => {
    const mockData = [
      { id: 1, payload: '{"soc": 95}', synced: 1, created_at: '2026-04-13 10:00:00' },
      { id: 2, payload: '{"soc": 94}', synced: 0, created_at: '2026-04-13 10:00:05' }
    ];
    getTelemetry.mockReturnValue(mockData);

    const { getByText } = render(<SQLiteInspectorScreen />);

    await waitFor(() => {
      expect(getByText('Record ID: 1')).toBeTruthy();
      expect(getByText('Record ID: 2')).toBeTruthy();
      expect(getByText('SYNCED')).toBeTruthy();
      expect(getByText('PENDING')).toBeTruthy();
      expect(getByText('2 records found')).toBeTruthy();
    });
  });

  it('handles database fetch errors gracefully', async () => {
    getTelemetry.mockImplementation(() => {
      throw new Error('Database locked');
    });

    const { getByText } = render(<SQLiteInspectorScreen />);

    await waitFor(() => {
      expect(getByText('Failed to query database.')).toBeTruthy();
    });
  });

  it('injects mock data and refreshes list', async () => {
    getTelemetry.mockReturnValue([]);
    const { getByText } = render(<SQLiteInspectorScreen />);

    const injectButton = getByText('Inject Mock Data');
    fireEvent.press(injectButton);

    expect(insertTelemetry).toHaveBeenCalledTimes(1);
    
    expect(insertTelemetry).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'tester@featherstill.com',
        moduleId: 'MOCK_ESP32',
      })
    );
    expect(getTelemetry).toHaveBeenCalledTimes(2); // 1 for mount, 1 for refresh
  });

  it('triggers confirmation alert on Clear Database press', async () => {
    getTelemetry.mockReturnValue([]);
    const { getByText } = render(<SQLiteInspectorScreen />);

    const clearButton = getByText('Clear Database');
    fireEvent.press(clearButton);

    expect(alertSpy).toHaveBeenCalledWith(
      'Clear Local Buffer',
      'Are you sure? This will delete all telemetry data.',
      expect.any(Array) 
    );
    
    expect(clearAllTelemetry).not.toHaveBeenCalled();
  });

  it('clears database and refreshes when confirmation is accepted', async () => {
    getTelemetry.mockReturnValue([]);
    const { getByText } = render(<SQLiteInspectorScreen />);

    fireEvent.press(getByText('Clear Database'));

    const buttons = alertSpy.mock.calls[0][2];
    const deleteButton = buttons.find(b => b.text === 'Delete');
    
    deleteButton.onPress();

    expect(clearAllTelemetry).toHaveBeenCalledTimes(1);
    expect(getTelemetry).toHaveBeenCalledTimes(2); // 1 for mount, 1 for refresh
  });

  it('fetches fresh data when manual Refresh button is pressed', async () => {
    getTelemetry.mockReturnValue([]);
    const { getByText } = render(<SQLiteInspectorScreen />);

    const refreshButton = getByText('Refresh');
    fireEvent.press(refreshButton);

    expect(getTelemetry).toHaveBeenCalledTimes(2);
  });
});