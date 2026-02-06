import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function CartScreen({ onCheckout }) {
  const { items, removeItem, updateQty, totals } = useCart();
  const { isAuthenticated } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>Review items and place your order</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Your cart is empty</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemMeta}>₹{Math.round(item.price || 0)}</Text>
            </View>
            <View style={styles.qtyWrap}>
              <TouchableOpacity onPress={() => updateQty(item.id, item.qty - 1)} style={styles.qtyBtn}>
                <Text style={styles.qtyText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.qty}</Text>
              <TouchableOpacity
                onPress={() => {
                  const res = updateQty(item.id, item.qty + 1);
                  if (res && res.updated === false) {
                    const maxQty = typeof item.quantity === 'number' ? item.quantity : null;
                    Alert.alert(
                      'Stock limit reached',
                      maxQty ? `Only ${maxQty} left in stock.` : 'You cannot add more than available stock.'
                    );
                  }
                }}
                style={styles.qtyBtn}
              >
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.id)}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.summary}>
        <View>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>₹{Math.round(totals.subtotal || 0)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => {
            if (!isAuthenticated) {
              Alert.alert('Sign in required', 'Please sign in to place an order.');
              return;
            }
            onCheckout?.();
          }}
        >
          <Text style={styles.checkoutText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
  heroCard: {
    marginHorizontal: customerSpacing.lg,
    marginTop: customerSpacing.md,
    padding: customerSpacing.lg,
    borderRadius: 20,
    backgroundColor: customerColors.card,
    borderWidth: 1,
    borderColor: customerColors.border,
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '800', color: customerColors.text },
  subtitle: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  list: { paddingHorizontal: customerSpacing.lg, paddingBottom: customerSpacing.lg },
  empty: { textAlign: 'center', color: customerColors.muted, marginTop: 40 },
  itemCard: {
    backgroundColor: customerColors.card,
    borderRadius: 16,
    padding: customerSpacing.md,
    marginBottom: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  itemTitle: { fontSize: 14, fontWeight: '700', color: customerColors.text },
  itemMeta: { color: customerColors.muted, marginTop: 4 },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: customerSpacing.sm,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: customerColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { color: customerColors.text, fontWeight: '700' },
  qtyValue: { marginHorizontal: 10, fontWeight: '700', color: customerColors.text },
  remove: { marginTop: customerSpacing.sm, color: customerColors.danger, fontSize: 12 },
  summary: {
    borderTopWidth: 1,
    borderColor: customerColors.border,
    padding: customerSpacing.lg,
    backgroundColor: customerColors.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: { color: customerColors.muted, fontSize: 12 },
  summaryValue: { color: customerColors.text, fontWeight: '800', fontSize: 18 },
  checkoutBtn: {
    backgroundColor: customerColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  checkoutText: { color: '#FFFFFF', fontWeight: '700' },
});
