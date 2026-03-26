import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';

import { useAppContext } from '../context/AppContext';

function getRiskColor(health, temp) {
  if (temp >= 45 || health < 60) return '#DC2626';
  if (temp >= 35 || health < 80) return '#D97706';
  return '#16A34A';
}

function HistoryRow({ item }) {
  const riskColor = getRiskColor(item.health, item.temperature);
  const healthPct = item.health;

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.timeWrap}>
          <Ionicons name="time-outline" size={13} color="#94A3B8" />
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: riskColor + '18' }]}>
          <Text style={[styles.badgeText, { color: riskColor }]}>{item.health}% health</Text>
        </View>
      </View>

      {/* Health bar */}
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${healthPct}%`, backgroundColor: riskColor }]} />
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Voltage</Text>
          <Text style={styles.metricValue}>{item.voltage.toFixed(2)}V</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Current</Text>
          <Text style={styles.metricValue}>{item.current.toFixed(2)}A</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Temp</Text>
          <Text style={styles.metricValue}>{item.temperature.toFixed(1)}°C</Text>
        </View>
      </View>
    </View>
  );
}

let lastDate = '';

export default function HistoryScreen() {
  const { history } = useAppContext();
  lastDate = '';
  
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Header title="History" subtitle="Past battery readings" />
        }
        renderItem={({ item }) => {
          const showDate = item.date !== lastDate;
          lastDate = item.date;
          return (
            <>
              {showDate ? (
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateLabel}>{item.date}</Text>
                </View>
              ) : null}
              <HistoryRow item={item} />
            </>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
  },
  dateSeparator: {
    marginBottom: 8,
    marginTop: 4,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  barBg: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
});
