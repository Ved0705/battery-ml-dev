import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import BatteryCard from '../components/BatteryCard';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

import { getBatteryPrediction } from '../utils/api';
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
  
  const [prediction, setPrediction] = useState(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState('');

  const handlePredict = async () => {
    setIsPredicting(true);
    setPredictError('');
    try {
      const prevData = history[1] || currentData;
      const v_drop = prevData.voltage - currentData.voltage;
      const t_change = currentData.temperature - prevData.temperature;

      const reqData = {
        voltage: currentData.voltage || 0,
        current: currentData.current || 0,
        temperature: currentData.temperature || 0,
        time: history.length * 10,
        battery_type: "Li-ion",
        power: (currentData.voltage || 0) * (currentData.current || 0),
        voltage_drop_rate: v_drop > 0 ? v_drop : 0,
        temp_change_rate: t_change || 0,
        current_spike: prevData.current ? currentData.current / prevData.current : 1
      };

      const result = await getBatteryPrediction(reqData);
      setPrediction(result);
    } catch (err) {
      setPredictError(err.message || 'API Failed');
    } finally {
      setIsPredicting(false);
    }
  };

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
        <View style={styles.predictSection}>
          <TouchableOpacity 
            style={[styles.predictButton, isPredicting && styles.predictButtonDisabled]} 
            onPress={handlePredict} 
            disabled={isPredicting}
          >
            <Text style={styles.predictButtonText}>
              {isPredicting ? "Predicting..." : "Get AI Prediction"}
            </Text>
          </TouchableOpacity>
          {predictError ? <Text style={styles.errorText}>{predictError}</Text> : null}
          <PredictionCard prediction={prediction} />
        </View>

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
  predictSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  predictButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  predictButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  predictButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#DC2626',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600'
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
