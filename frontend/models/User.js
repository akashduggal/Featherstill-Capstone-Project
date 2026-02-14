/**
 * Represents a user in the application.
 */
export class User {
  constructor({ uid, email, displayName, photoURL }) {
    this.uid = uid;
    this.email = email;
    this.displayName = displayName || '';
    this.photoURL = photoURL || null;
  }

  static fromFirebaseUser(firebaseUser) {
    if (!firebaseUser) return null;
    return new User({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
    });
  }
}
