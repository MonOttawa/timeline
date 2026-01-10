import React, { useEffect, useState } from 'react';
import { onAuthChange, getCurrentUser, clearSession, refreshSession } from '../lib/api/auth';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    refreshSession().then(setUser);
    const unsubscribe = onAuthChange(() => setUser(getCurrentUser()));

    return () => {
      unsubscribe();
    };
  }, []);

  const signOut = () => {
    clearSession();
    setUser(null);
  };

  const value = {
    user,
    loading: false,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
