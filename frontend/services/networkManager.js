import { getAuth, getIdToken } from '@react-native-firebase/auth';

const getAuthToken = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.warn('[Network] No Firebase currentUser. Token unavailable.');
    return null;
  }

  try {
    const token = await getIdToken(currentUser);
    console.log('[Network] Firebase token fetched:', {
      uid: currentUser.uid,
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
    });
    return token;
  } catch (error) {
    console.error('[Network] Failed to retrieve Firebase token:', error?.message || error);
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

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  console.log('[Network] POST request debug:', {
    url,
    hasAuthHeader: !!headers.Authorization,
    bodyType: Array.isArray(body) ? 'array' : typeof body,
    batchCount: Array.isArray(body?.batch) ? body.batch.length : undefined,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (response.status === 401) {
    const text = await response.text().catch(() => '');
    console.error('[Network] 401 Unauthorized:', text || 'No body');
  }

  return response;
};