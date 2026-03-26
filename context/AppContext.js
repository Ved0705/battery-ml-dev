import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AppContext = createContext({});

const generateReading = (prevHealth) => {
  const variation = (Math.random() - 0.5) * 0.1; // small random walk
  return {
    id: Math.random().toString(36).substr(2, 9),
    date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    health: Math.max(85, Math.min(100, (prevHealth || 92) + variation)),
    voltage: 3.8 + Math.random() * 0.4,
    current: 1.0 + Math.random() * 0.5,
    temperature: 28 + Math.random() * 8, // 28 to 36 C
  };
};

export function AppProvider({ children }) {
  const [refreshRate, setRefreshRate] = useState(5000); // ms
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Start with one initial reading
  const [history, setHistory] = useState([generateReading(92)]);
  
  const addReading = useCallback(() => {
    setHistory(prev => {
      const newReading = generateReading(prev.length > 0 ? prev[0].health : 92);
      const newHistory = [newReading, ...prev];
      // Keep only last 15 readings
      if (newHistory.length > 15) {
        newHistory.pop();
      }
      return newHistory;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      refreshRate, setRefreshRate,
      alertsEnabled, setAlertsEnabled,
      autoRefresh, setAutoRefresh,
      darkMode, setDarkMode,
      history, addReading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
