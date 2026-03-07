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
    let url = getApiUrl('/api/battery-readings');
    // normalize URL if getApiUrl returned host:port/path without scheme
    if (url && !/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }
    console.log('[Battery API] POST URL:', url);
    console.log('[Battery API] Payload:', JSON.stringify(payload));

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutMs = (API_CONFIG && API_CONFIG.TIMEOUT) ? API_CONFIG.TIMEOUT : 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP ${response.status}`;
      const details = Array.isArray(errorData.details) ? errorData.details.join(', ') : (errorData.details || '');
      const fullError = details ? `${errorMessage}: ${details}` : errorMessage;

      console.error('[Battery API] POST failed:', fullError);
      console.error('[Battery API] Full error response:', JSON.stringify(errorData, null, 2));

      return { success: false, error: fullError };
    }

    const responseData = await response.json();
    console.log('[Battery API] POST successful:', responseData);

    return { success: true, data: responseData.data };
  } catch (error) {
    console.error('[Battery API] Request failed:', error && error.message, error);
    if (error && error.name === 'AbortError') {
      return { success: false, error: 'Request timeout - server not responding' };
    }
    if (error && error.message === 'Network request failed') {
      console.error('[Battery API] Hint: device/emulator cannot reach the URL (check Wi‑Fi, Expo mode, EC2 security group, and HTTP scheme).');
    }
    return { success: false, error: (error && error.message) || 'Network error' };
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

    let url = getApiUrl(`/api/battery-readings/${email}?${query}`);
    if (url && !/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }

    const controller = new AbortController();
    const timeoutMs = (API_CONFIG && API_CONFIG.TIMEOUT) ? API_CONFIG.TIMEOUT : 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseData = await response.json();

    return { success: true, data: responseData.data, pagination: responseData.pagination };
  } catch (error) {
    console.error('[Battery API] Get readings failed:', error && error.message, error);
    if (error && error.name === 'AbortError') {
      return { success: false, error: 'Request timeout - server not responding' };
    }
    return { success: false, error: (error && error.message) || 'Failed to fetch readings' };
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

    let url = getApiUrl(`/api/battery-readings/${email}/latest`);
    if (url && !/^https?:\/\//i.test(url)) {
      url = `http://${url}`;
    }

    const controller = new AbortController();
    const timeoutMs = (API_CONFIG && API_CONFIG.TIMEOUT) ? API_CONFIG.TIMEOUT : 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const responseData = await response.json();

    return { success: true, data: responseData.data };
  } catch (error) {
    console.error('[Battery API] Get latest failed:', error && error.message, error);
    if (error && error.name === 'AbortError') {
      return { success: false, error: 'Request timeout - server not responding' };
    }
    return { success: false, error: (error && error.message) || 'Failed to fetch latest reading' };
  }
};

// Replace existing testConnectivity with this normalized version
export const testConnectivity = async (timeoutMs = 5000) => {
  // helper to perform a fetch with timeout and return a small result object
  const tryFetch = async (url, timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      return { ok: res.ok, status: res.status };
    } catch (err) {
      clearTimeout(timeoutId);
      return { error: err && err.message ? err.message : String(err), name: err && err.name };
    }
  };

  try {
    // 1) Basic internet check against a reliable HTTPS host (example.com)
    const publicCheck = await tryFetch('https://example.com/', timeoutMs);
    const internetUp = !publicCheck.error && publicCheck.ok;

    // 2) API server check (use exact API URL from getApiUrl)
    let apiUrl = getApiUrl('/api/health') || getApiUrl('/api/battery-readings') || '';
    // Normalize: ensure it has a scheme
    if (apiUrl && !/^https?:\/\//i.test(apiUrl)) {
      apiUrl = `http://${apiUrl}`;
    }

    const serverCheck = await tryFetch(apiUrl, timeoutMs);

    // Build diagnostic result
    const result = {
      internet: {
        reachable: internetUp,
        status: publicCheck.status || null,
        error: publicCheck.error || null,
        errorName: publicCheck.name || null,
      },
      server: {
        url: apiUrl,
        reachable: !serverCheck.error && serverCheck.ok,
        status: serverCheck.status || null,
        error: serverCheck.error || null,
        errorName: serverCheck.name || null,
      },
    };

    console.log('[Battery API] testConnectivity result:', JSON.stringify(result, null, 2));
    return { success: result.server.reachable, result };
  } catch (err) {
    console.error('[Battery API] testConnectivity unexpected error:', err && err.message, err);
    return { success: false, error: err && err.message ? err.message : String(err) };
  }
};
