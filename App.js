import React, { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

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

const MetricCard = ({ title, value }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </View>
);

export default function App() {
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
      <View style={styles.dashboard}>
        <Text style={styles.heading}>Battery Health Monitor</Text>

        <MetricCard
          title="Battery Health"
          value={formatValue(batteryData.health, '%')}
        />
        <MetricCard
          title="Voltage"
          value={formatValue(batteryData.voltage, 'V', 2)}
        />
        <MetricCard
          title="Current"
          value={formatValue(batteryData.current, 'A', 2)}
        />
        <MetricCard
          title="Temperature"
          value={formatValue(batteryData.temperature, '°C', 1)}
        />

        <View style={[styles.card, styles.riskCard]}>
          <Text style={styles.cardTitle}>Risk Level</Text>
          <Text style={[styles.riskValue, { color: riskColor }]}>{riskLevel}</Text>
        </View>
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
  dashboard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 18,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 24,
    color: '#0F172A',
    fontWeight: '700',
  },
  riskCard: {
    marginTop: 4,
  },
  riskValue: {
    fontSize: 28,
    fontWeight: '800',
  },
});
