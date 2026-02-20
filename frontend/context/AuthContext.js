import React, { createContext, useState, useContext, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

const AuthContext = createContext({
  user: null,
  loading: true,
  loginWithGoogle: async () => {},
  loginAsGuest: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (loading) setLoading(false);
    });
    return subscriber; 
  }, [loading]);

  const loginWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      if (!idToken) throw new Error('No ID token found');

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
    } catch (error) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.error('Google Sign-In Error:', error);
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      const currentUser = auth().currentUser;
      const isGoogleLogin = currentUser?.providerData.some(
        (provider) => provider.providerId === 'google.com'
      );

      await auth().signOut();
      
      if (isGoogleLogin) {
        try {
          await GoogleSignin.revokeAccess();
          await GoogleSignin.signOut();
        } catch (googleError) {
          console.log('Google SDK cleanup:', googleError);
        }
      }
    } catch (error) {
      console.error('Logout Error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithGoogle, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};