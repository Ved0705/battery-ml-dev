import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import BatteryCard from '../components/BatteryCard';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

import { calculatePrediction } from '../utils/prediction';
import PredictionCard from '../components/PredictionCard';

const getRiskLevel = (temperature, health) => {
  if (temperature >= 45 || health < 60) return { label: 'High', color: '#DC2626' };
  if (temperature >= 35 || health < 80) return { label: 'Medium', color: '#D97706' };
  return { label: 'Low', color: '#16A34A' };
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const { refreshRate, autoRefresh, history, addReading } = useAppContext();
  
  // The first item in history is our current live reading
  const currentData = history[0] || { health: 92, voltage: 3.98, current: 1.25, temperature: 31.4 };
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Clock tick
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    
    // Polling tick
    let dataTimer;
    if (autoRefresh) {
      dataTimer = setInterval(() => {
        addReading();
      }, refreshRate);
    }
    
    return () => {
      clearInterval(clockTimer);
      if (dataTimer) clearInterval(dataTimer);
    };
  }, [autoRefresh, refreshRate, addReading]);

  const risk = useMemo(
    () => getRiskLevel(currentData.temperature, currentData.health),
    [currentData]
  );
  
  const prediction = useMemo(
    () => calculatePrediction(currentData, history),
    [currentData, history]
  );

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header
          title={`Hello, ${user?.name || 'User'}`}
          subtitle={`Last updated: ${timeStr}`}
          statusDot={autoRefresh}
        />

        {/* AI Prediction Section */}
        <PredictionCard prediction={prediction} />

        <BatteryCard
          title="Battery Health"
          value={`${currentData.health.toFixed(1)}%`}
          icon="battery-charging"
          accentColor="#3B82F6"
          subtitle="State of charge capacity"
        />
        <BatteryCard
          title="Voltage"
          value={`${currentData.voltage.toFixed(2)} V`}
          icon="flash"
          accentColor="#8B5CF6"
          subtitle="Terminal voltage"
        />
        <BatteryCard
          title="Current"
          value={`${currentData.current.toFixed(2)} A`}
          icon="swap-horizontal"
          accentColor="#06B6D4"
          subtitle="Discharge current"
        />
        <BatteryCard
          title="Temperature"
          value={`${currentData.temperature.toFixed(1)} °C`}
          icon="thermometer"
          accentColor={currentData.temperature >= 35 ? '#D97706' : '#16A34A'}
          subtitle="Cell temperature"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  banner: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  bannerValue: {
    fontSize: 20,
    fontWeight: '800',
  },
});
