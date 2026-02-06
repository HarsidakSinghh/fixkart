import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';

const CATEGORIES = [
  'Fastening & Joining',
  'Electrical & Lighting',
  'Tools & Hardware',
  'Abrasives',
  'Flow Control',
  'Heating & Cooling',
];

export default function CategoryRail({ active, onSelect }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wrap}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[styles.pill, active === cat && styles.pillActive]}
          onPress={() => onSelect(cat)}
        >
          <Text style={[styles.pillText, active === cat && styles.pillTextActive]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: customerSpacing.lg,
    marginTop: customerSpacing.md,
  },
  pill: {
    backgroundColor: customerColors.card,
    borderColor: customerColors.border,
    borderWidth: 1,
    paddingHorizontal: customerSpacing.md,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: customerSpacing.sm,
  },
  pillActive: {
    backgroundColor: customerColors.primary,
    borderColor: customerColors.primary,
  },
  pillText: { color: customerColors.muted, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: '#FFFFFF' },
});
