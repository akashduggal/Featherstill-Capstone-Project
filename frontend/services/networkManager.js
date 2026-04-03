import { getAuth, getIdToken } from '@react-native-firebase/auth';

const getAuthToken = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  if (!currentUser) return null;

  try {
    return await getIdToken(currentUser);
  } catch (error) {
    console.error('Failed to retrieve Firebase token:', error);
    return null;
  }
};

/**
 * A reusable POST request wrapper.
 * @param {string} url - The endpoint URL
 * @param {object} body - The JSON payload
 * @param {boolean} requireAuth - If true, aborts request when token is missing
 */
export const makePostRequest = async (url, body, requireAuth = true) => {
  const token = await getAuthToken();
  
  if (requireAuth && !token) {
    throw new Error(`Authentication required. Aborting request to ${url}`);
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    console.error("401 Unauthorized: Token may be invalid or expired.");
  }

  return response;
};