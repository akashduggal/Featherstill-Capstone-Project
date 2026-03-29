/**
 * Battery API Service
 * Read + connectivity helpers for backend /api/battery-readings endpoints.
 * NOTE: Telemetry POST sync is handled directly in ../services/database.js
 */

import { API_CONFIG, getApiUrl } from '../config/api';

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
