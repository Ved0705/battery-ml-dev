import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    // In a real app, this would hit an API. Here we just mock it.
    setUser({ email, name: email.split('@')[0], id: 'user_' + Math.floor(Math.random() * 1000) });
  };

  const signup = (name, email, password) => {
    setUser({ email, name, id: 'user_' + Math.floor(Math.random() * 1000) });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
