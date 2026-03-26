import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import BatteryCard from '../components/BatteryCard';
import Header from '../components/Header';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Header title="Settings" subtitle="Device and refresh preferences" />

        <BatteryCard title="Device ID" value="BAT-DEV-1024" />
        <BatteryCard title="Refresh Rate" value="5 seconds" />
        <BatteryCard title="Alerts" value="Enabled" />
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
