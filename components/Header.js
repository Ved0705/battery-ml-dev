import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ title, subtitle, statusDot }) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        {statusDot !== undefined ? (
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: statusDot ? '#16A34A' : '#DC2626' }]} />
            <Text style={[styles.statusText, { color: statusDot ? '#16A34A' : '#DC2626' }]}>
              {statusDot ? 'Live' : 'Offline'}
            </Text>
          </View>
        ) : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
    paddingTop: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#94A3B8',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 14,
  },
});
