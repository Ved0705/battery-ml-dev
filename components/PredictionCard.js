import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PredictionCard({ prediction }) {
  if (!prediction) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={20} color="#8B5CF6" />
        <Text style={styles.headerTitle}>AI Prediction</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Est. Battery Life</Text>
          <Text style={styles.valueHighlight}>{prediction.remainingHours} hrs</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>Health Trend</Text>
          <Text style={[styles.value, { color: prediction.trendColor }]}>{prediction.trend}</Text>
        </View>

        <View style={[styles.gridItem, styles.fullWidth]}>
          <Text style={styles.label}>Risk Forecast</Text>
          <Text style={[styles.value, { color: prediction.riskColor }]}>{prediction.riskForecast}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#F8FAFC', // slightly different background
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridItem: {
    width: '46%', // two columns
  },
  fullWidth: {
    width: '100%',
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  valueHighlight: {
    fontSize: 22,
    color: '#0F172A',
    fontWeight: '800',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
});
