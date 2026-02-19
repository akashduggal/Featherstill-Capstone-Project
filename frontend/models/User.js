/**
 * Represents a user in the application.
 */
export class User {
  constructor({ uid, email, displayName, photoURL, isAnonymous = false }) {
    this.uid = uid;
    this.email = email;
    this.displayName = displayName || '';
    this.photoURL = photoURL || null;
    this.isAnonymous = isAnonymous;
  }

  static fromFirebaseUser(firebaseUser) {
    if (!firebaseUser) return null;
    return new User({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      isAnonymous: firebaseUser.isAnonymous,
    });
  }
}
