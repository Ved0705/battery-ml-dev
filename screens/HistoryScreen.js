import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, View } from 'react-native';
import BatteryCard from '../components/BatteryCard';
import Header from '../components/Header';

const historyReadings = [
  { id: '1', time: '09:30 AM', health: 92, voltage: 3.98, current: 1.25, temperature: 31.4 },
  { id: '2', time: '11:00 AM', health: 91, voltage: 3.95, current: 1.18, temperature: 32.1 },
  { id: '3', time: '01:15 PM', health: 90, voltage: 3.92, current: 1.31, temperature: 33.3 },
  { id: '4', time: '03:40 PM', health: 90, voltage: 3.9, current: 1.12, temperature: 34.0 },
];

const formatReading = (item) =>
  `${item.time} • ${item.health}% • ${item.voltage.toFixed(2)}V • ${item.current.toFixed(2)}A • ${item.temperature.toFixed(1)}°C`;

export default function HistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Header title="History" subtitle="Past battery readings" />

        <FlatList
          data={historyReadings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BatteryCard title={`Reading ${item.id}`} value={formatReading(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    flex: 1,
    alignItems: 'center',
  },
  listContent: {
    width: '100%',
    paddingBottom: 16,
  },
});
