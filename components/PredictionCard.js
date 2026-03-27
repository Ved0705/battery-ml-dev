import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PredictionCard({ prediction }) {
  if (!prediction) return null;

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Low': return '#16A34A';
      case 'Medium': return '#D97706';
      case 'High': return '#DC2626';
      default: return '#64748B';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={20} color="#8B5CF6" />
        <Text style={styles.headerTitle}>AI Forecast Results</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Est. Time to Failure</Text>
          <Text style={styles.valueHighlight}>{prediction.time_to_failure.toFixed(1)} hrs</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>Risk Forecast</Text>
          <Text style={[styles.valueHighlight, { color: getRiskColor(prediction.risk) }]}>{prediction.risk}</Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={styles.label}>Predicted SOC</Text>
          <Text style={styles.value}>{prediction.soc.toFixed(1)}%</Text>
        </View>
        <View style={styles.gridItem}>
          <Text style={styles.label}>Predicted SOH</Text>
          <Text style={styles.value}>{prediction.soh.toFixed(1)}%</Text>
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
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 6,
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
    marginBottom: 6,
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
