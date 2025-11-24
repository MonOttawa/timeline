import React, { useEffect, useState } from 'react';
import { pb } from '../lib/pocketbase';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => pb.authStore.model);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signOut = () => {
    pb.authStore.clear();
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
