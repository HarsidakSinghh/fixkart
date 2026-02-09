import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';

export default function CategoryDrawer({ visible, active, onClose, onSelect }) {
  const categories = [
    'All',
    'Fastening & Joining',
    'Electrical & Lighting',
    'Tools & Hardware',
    'Abrasives',
    'Flow Control',
    'Heating & Cooling',
    'Fabricating',
    'Lubricating',
    'Material Handling',
  ];
  const list = active && !categories.includes(active) ? [active, ...categories] : categories;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.panel}>
          <Text style={styles.title}>Browse Categories</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {list.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.item, active === cat && styles.itemActive]}
                onPress={() => {
                  onSelect(cat);
                  onClose();
                }}
              >
                <Text style={[styles.itemText, active === cat && styles.itemTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(7, 15, 30, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    width: '72%',
    backgroundColor: customerColors.card,
    padding: customerSpacing.lg,
    paddingTop: customerSpacing.xl,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: -2, height: 6 },
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: customerColors.text,
    marginBottom: customerSpacing.md,
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: customerColors.border,
  },
  itemActive: {
    backgroundColor: customerColors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  itemText: {
    color: customerColors.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  itemTextActive: {
    color: customerColors.primary,
  },
});
