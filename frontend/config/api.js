/**
 * API Configuration
 * Centralized settings for backend communication
 */

const normalizeBaseUrl = (url) => {
  if (!url) return '';
  const withProtocol = /^https?:\/\//i.test(url) ? url : `http://${url}`;
  return withProtocol.replace(/\/+$/, '');
};

export const API_CONFIG = {
  // Base URL for backend API (set in frontend/.env)
  BASE_URL: normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
  
  // Request timeout (milliseconds)
  TIMEOUT: 10000,
  
  // Number of retry attempts for failed requests
  RETRY_ATTEMPTS: 1,
};

/**
 * Construct full API endpoint URL
 * @param {string} endpoint - API endpoint path (e.g., '/api/battery-readings')
 * @returns {string} Full URL
 */
export const getApiUrl = (endpoint) => {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.BASE_URL}${path}`;
};
