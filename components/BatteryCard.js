import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BatteryCard({ title, value, valueColor, icon, subtitle, accentColor }) {
  return (
    <View style={[styles.card, accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 4 } : null]}>
      <View style={styles.row}>
        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: (accentColor || '#3B82F6') + '18' }]}>
            <Ionicons name={icon} size={20} color={accentColor || '#3B82F6'} />
          </View>
        ) : null}
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  value: {
    fontSize: 20,
    color: '#0F172A',
    fontWeight: '700',
  },
});
