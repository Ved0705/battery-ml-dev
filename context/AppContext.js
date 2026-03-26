import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getHistory } from '../backend/firebase/batteryService';

const AppContext = createContext({});

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [refreshRate, setRefreshRate] = useState(5000); // ms
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch from Firestore
  const fetchReading = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      // For multi-user apps, link user ID directly to device ID, or create a pairing system. Here we use user.id directly.
      const data = await getHistory(user.id, 15);
      
      const formattedData = data.map(item => {
        const d = new Date(item.timestamp);
        return {
          id: item.id,
          date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          health: item.health,
          risk: item.risk,
          voltage: item.voltage,
          current: item.current,
          temperature: item.temperature,
        };
      });
      setHistory(formattedData);
    } catch (e) {
      console.error('Error fetching battery data:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Provide a fallback function hook under the same name for backward compatibility
  const addReading = fetchReading;

  useEffect(() => {
    if (autoRefresh && user?.id) {
      fetchReading();
      const interval = setInterval(fetchReading, refreshRate);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, user, refreshRate, fetchReading]);

  return (
    <AppContext.Provider value={{
      refreshRate, setRefreshRate,
      alertsEnabled, setAlertsEnabled,
      autoRefresh, setAutoRefresh,
      darkMode, setDarkMode,
      history, addReading, loading
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
