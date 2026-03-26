import React, { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import BatteryCard from '../components/BatteryCard';
import Header from '../components/Header';

const initialBatteryData = {
  health: 92,
  voltage: 3.98,
  current: 1.25,
  temperature: 31.4,
};

const getRiskLevel = (temperature, health) => {
  if (temperature >= 45 || health < 60) return 'High';
  if (temperature >= 35 || health < 80) return 'Medium';
  return 'Low';
};

const formatValue = (value, unit, decimals = 0) => `${value.toFixed(decimals)} ${unit}`;

export default function DashboardScreen() {
  const [batteryData] = useState(initialBatteryData);

  const riskLevel = useMemo(
    () => getRiskLevel(batteryData.temperature, batteryData.health),
    [batteryData]
  );

  const riskColor = useMemo(() => {
    if (riskLevel === 'High') return '#DC2626';
    if (riskLevel === 'Medium') return '#EAB308';
    return '#16A34A';
  }, [riskLevel]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Header title="Battery Health Monitor" subtitle="Live battery performance overview" />

        <BatteryCard title="Battery Health" value={formatValue(batteryData.health, '%')} />
        <BatteryCard title="Voltage" value={formatValue(batteryData.voltage, 'V', 2)} />
        <BatteryCard title="Current" value={formatValue(batteryData.current, 'A', 2)} />
        <BatteryCard title="Temperature" value={formatValue(batteryData.temperature, '°C', 1)} />
        <BatteryCard title="Risk Level" value={riskLevel} valueColor={riskColor} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
});
