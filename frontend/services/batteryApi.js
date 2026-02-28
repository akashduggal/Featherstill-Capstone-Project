/**
 * Battery API Service
 * Handles all communication with backend /api/battery-readings endpoint
 */

import { API_CONFIG, getApiUrl } from '../config/api';

/**
 * Validate required fields before posting
 * @param {Object} data - Data to validate
 * @param {string} email - User email or uid
 * @param {string} batteryId - Battery identifier
 * @returns {Object} { isValid, error }
 */
const validateBatteryData = (data, email, batteryId) => {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'User email/uid is required' };
  }

  if (!batteryId || batteryId.trim() === '') {
    return { isValid: false, error: 'Battery ID is required' };
  }

  if (typeof data !== 'object' || data === null) {
    return { isValid: false, error: 'Invalid battery data format' };
  }

  return { isValid: true };
};

/**
 * Post battery telemetry data to backend
 * 
 * @param {Object} batteryData - Battery metrics object
 * @param {string} email - User email (for registered users) or Firebase UID (for guests)
 * @param {string} batteryId - Unique identifier for the battery
 * @returns {Promise<Object>} { success, data, error }
 * 
 * @example
 * const result = await postBatteryReading(
 *   {
 *     totalBatteryVoltage: 57.44,
 *     cellTemperature: 37.0,
 *     currentAmps: -19.83,
 *     stateOfCharge: 100,
 *     chargingStatus: 'INACTIVE',
 *     cellVoltages: [3.58, 3.60, ...],
 *     // ... other fields
 *   },
 *   'user@gmail.com', // or 'Azx123FirebaseUID'
 *   'primary-battery-001'
 * );
 */
export const postBatteryReading = async (batteryData, email, batteryId) => {
  try {
    // Validate inputs
    const validation = validateBatteryData(batteryData, email, batteryId);
    if (!validation.isValid) {
      console.warn('Validation error:', validation.error);
      return {
        success: false,
        error: validation.error,
      };
    }

    // Construct payload
    const payload = {
      email: email.trim(),
      batteryId: batteryId.trim(),
      ...batteryData,
    };

    console.log('[Battery API] Posting reading for battery:', batteryId);
    console.log('[Battery API] POST URL:', getApiUrl('/api/battery-readings'));
    // Make POST request
    const response = await fetch(getApiUrl('/api/battery-readings'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: API_CONFIG.TIMEOUT,
    });

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      console.error('[Battery API] POST failed:', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const responseData = await response.json();
    console.log('[Battery API] POST successful:', responseData);

    return {
      success: true,
      data: responseData.data,
    };
  } catch (error) {
    console.error('[Battery API] Request failed:', error.message);
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
};

/**
 * Get battery readings history for a user
 * 
 * @param {string} email - User email or uid
 * @param {Object} options - Query options
 * @param {number} options.limit - Number of records (default: 100)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @returns {Promise<Object>} { success, data, pagination, error }
 */
export const getBatteryReadings = async (email, options = {}) => {
  try {
    if (!email || email.trim() === '') {
      return {
        success: false,
        error: 'Email is required',
      };
    }

    const limit = options.limit || 100;
    const offset = options.offset || 0;
    const query = new URLSearchParams({ limit, offset });

    const response = await fetch(
      getApiUrl(`/api/battery-readings/${email}?${query}`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: API_CONFIG.TIMEOUT,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseData = await response.json();

    return {
      success: true,
      data: responseData.data,
      pagination: responseData.pagination,
    };
  } catch (error) {
    console.error('[Battery API] Get readings failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to fetch readings',
    };
  }
};

/**
 * Get the latest battery reading for a user
 * 
 * @param {string} email - User email or uid
 * @returns {Promise<Object>} { success, data, error }
 */
export const getLatestBatteryReading = async (email) => {
  try {
    if (!email || email.trim() === '') {
      return {
        success: false,
        error: 'Email is required',
      };
    }

    const response = await fetch(
      getApiUrl(`/api/battery-readings/${email}/latest`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: API_CONFIG.TIMEOUT,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseData = await response.json();

    return {
      success: true,
      data: responseData.data,
    };
  } catch (error) {
    console.error('[Battery API] Get latest failed:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to fetch latest reading',
    };
  }
};
