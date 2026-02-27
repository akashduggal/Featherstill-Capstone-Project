/**
 * API Configuration
 * Centralized settings for backend communication
 */

export const API_CONFIG = {
  // Base URL for backend API
  BASE_URL: 'http://localhost:3000',
  
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
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
