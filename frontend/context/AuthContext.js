import React, { createContext, useState, useContext, useEffect } from 'react';
import auth from '@react-native-firebase/auth';
import { User } from '../models/User';

const AuthContext = createContext({
    user: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
    signup: async () => { },
    loginAsGuest: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(async (authenticatedUser) => {
            if (authenticatedUser) {
                const userData = {
                    uid: authenticatedUser.uid,
                    email: authenticatedUser.email,
                    displayName: authenticatedUser.displayName,
                    photoURL: authenticatedUser.photoURL,
                    isAnonymous: authenticatedUser.isAnonymous,
                };

                if (authenticatedUser.isAnonymous) {
                    userData.displayName = 'Guest User';
                    userData.email = 'guest@fetherstill.com';
                }

                const user = new User(userData);
                setUser(user);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = async (userData) => {
        setLoading(true);
        try {
            // This is now primarily handled by onAuthStateChanged
            // We can still simulate a delay for UI purposes if needed
            await new Promise(resolve => setTimeout(resolve, 500));
            // The user state will be set by the listener
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loginAsGuest = async () => {
        setLoading(true);
        try {
            await auth().signInAnonymously();
            // onAuthStateChanged will handle the rest
        } catch (error) {
            console.error('Guest login error', error);
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        setLoading(true);
        try {
            await auth().signOut();
            // User state will be set to null by onAuthStateChanged
        } catch (error) {
            console.error('Logout Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const signup = async (email, password) => {
        // This should be implemented with Firebase auth
        // For now, it remains a placeholder
        return login(email, password);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, signup, loginAsGuest }}>
            {children}
        </AuthContext.Provider>
    );
};
