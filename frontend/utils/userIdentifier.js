/**
 * Utility to get user identifier for API posting
 * - For Google users: returns email
 * - For guests: returns Firebase UID
 */
export const getUserIdentifier = (user, isGuest) => {
  if (isGuest && user?.uid) {
    return user.uid;
  }
  return user?.email || 'unknown';
};
