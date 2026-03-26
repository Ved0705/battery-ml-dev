import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../backend/firebase/config';
import { loginDeviceOwner, registerDeviceOwner, logoutDeviceOwner } from '../backend/firebase/authService';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({ email: currentUser.email, name: currentUser.email?.split('@')[0], id: currentUser.uid });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    await loginDeviceOwner(email, password);
  };

  const signup = async (name, email, password) => {
    await registerDeviceOwner(email, password);
  };

  const logout = async () => {
    await logoutDeviceOwner();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
