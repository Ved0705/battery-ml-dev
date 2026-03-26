import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

function SettingRow({ icon, iconColor, label, value, isSwitch, switchValue, onToggle }) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: iconColor + '18' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onToggle}
          trackColor={{ false: '#E2E8F0', true: '#3B82F6' }}
          thumbColor={'#FFFFFF'}
        />
      ) : (
        <TouchableOpacity style={styles.valueWrap} onPress={onToggle}>
          <Text style={styles.rowValue}>{value}</Text>
          <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function SectionTitle({ title }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function SettingsScreen() {
  const { logout } = useAuth();
  const { 
    refreshRate, setRefreshRate, 
    alertsEnabled, setAlertsEnabled, 
    autoRefresh, setAutoRefresh, 
    darkMode, setDarkMode 
  } = useAppContext();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Settings" subtitle="Device configuration" />

        <SectionTitle title="DEVICE" />
        <View style={styles.section}>
          <SettingRow
            icon="hardware-chip-outline"
            iconColor="#8B5CF6"
            label="Device ID"
            value="BAT-DEV-1024"
          />
          <View style={styles.separator} />
          <SettingRow
            icon="wifi-outline"
            iconColor="#06B6D4"
            label="Connection"
            value="Bluetooth"
          />
          <View style={styles.separator} />
          <SettingRow
            icon="shield-checkmark-outline"
            iconColor="#16A34A"
            label="Firmware"
            value="v2.1.4"
          />
        </View>

        <SectionTitle title="PREFERENCES" />
        <View style={styles.section}>
          <SettingRow
            icon="timer-outline"
            iconColor="#3B82F6"
            label="Refresh Rate"
            value={`${refreshRate / 1000} seconds`}
            onToggle={() => setRefreshRate(prev => prev === 5000 ? 10000 : 5000)}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="notifications-outline"
            iconColor="#D97706"
            label="Alerts"
            isSwitch
            switchValue={alertsEnabled}
            onToggle={setAlertsEnabled}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="refresh-outline"
            iconColor="#06B6D4"
            label="Auto Refresh"
            isSwitch
            switchValue={autoRefresh}
            onToggle={setAutoRefresh}
          />
          <View style={styles.separator} />
          <SettingRow
            icon="moon-outline"
            iconColor="#6366F1"
            label="Dark Mode"
            isSwitch
            switchValue={darkMode}
            onToggle={setDarkMode}
          />
        </View>

        <SectionTitle title="ABOUT" />
        <View style={styles.section}>
          <SettingRow
            icon="information-circle-outline"
            iconColor="#64748B"
            label="App Version"
            value="1.0.0"
          />
          <View style={styles.separator} />
          <SettingRow
            icon="document-text-outline"
            iconColor="#64748B"
            label="Licenses"
            value=""
          />
        </View>

        <TouchableOpacity style={styles.resetBtn} activeOpacity={0.8} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.resetText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  valueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 62,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 4,
  },
  resetText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '600',
  },
});
