import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

export default function SkeletonCard({ height = 120 }) {
  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.lineShort} />
      <View style={styles.line} />
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lineShort: {
    height: 10,
    width: '50%',
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  line: {
    height: 10,
    width: '80%',
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
});
