import React, { createContext, useState, useContext, useEffect } from 'react';
import { User } from '../models/User';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulate checking for persisted user on mount
  useEffect(() => {
    const checkUser = async () => {
      // TODO: Replace with actual Firebase Auth listener
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    // TODO: Replace with actual Firebase login
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUser = new User({
        uid: 'mock-user-123',
        email: email,
        displayName: 'Test User',
      });
      setUser(mockUser);
      return mockUser;
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password) => {
    // Similar to login for now
    return login(email, password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};
