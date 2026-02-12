import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { customerColors, customerSpacing } from './CustomerTheme';
import { getCustomerComplaints, getCustomerRefunds } from './customerApi';

export default function CustomerSupportHistoryScreen({ onBack }) {
  const [tab, setTab] = useState('complaints');
  const [complaints, setComplaints] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [complaintData, refundData] = await Promise.all([
        getCustomerComplaints(),
        getCustomerRefunds(),
      ]);
      setComplaints(complaintData.complaints || []);
      setRefunds(refundData.refunds || []);
    } catch (error) {
      console.error('Failed to load support history', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Support History</Text>
        <Text style={styles.subtitle}>Track complaints and refunds</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'complaints' && styles.tabBtnActive]}
            onPress={() => setTab('complaints')}
          >
            <Text style={[styles.tabText, tab === 'complaints' && styles.tabTextActive]}>
              Complaints
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'refunds' && styles.tabBtnActive]}
            onPress={() => setTab('refunds')}
          >
            <Text style={[styles.tabText, tab === 'refunds' && styles.tabTextActive]}>
              Refunds
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {tab === 'complaints' ? (
          complaints.length === 0 && !loading ? (
            <Text style={styles.emptyText}>No complaints raised yet.</Text>
          ) : (
            complaints.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardTitle}>Order {item.orderId?.slice(-6).toUpperCase()}</Text>
                <Text style={styles.cardMeta}>{item.message}</Text>
                <View style={[styles.statusPill, complaintStyle(item.status)]}>
                  <Text style={styles.statusText}>{item.status || 'OPEN'}</Text>
                </View>
              </View>
            ))
          )
        ) : refunds.length === 0 && !loading ? (
          <Text style={styles.emptyText}>No refund requests yet.</Text>
        ) : (
          refunds.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.cardTitle}>Item {item.orderItemId?.slice(-6).toUpperCase()}</Text>
              <Text style={styles.cardMeta}>{item.reason}</Text>
              <View style={[styles.statusPill, refundStyle(item.status)]}>
                <Text style={styles.statusText}>{item.status || 'PENDING'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {onBack ? (
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>Back to Profile</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  function complaintStyle(status) {
    if (status === 'RESOLVED') return styles.statusSuccess;
    if (status === 'IN_REVIEW') return styles.statusWarning;
    return styles.statusDanger;
  }

  function refundStyle(status) {
    if (status === 'APPROVED') return styles.statusSuccess;
    if (status === 'REJECTED') return styles.statusDanger;
    return styles.statusWarning;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg, paddingHorizontal: customerSpacing.lg },
  heroCard: {
    marginTop: customerSpacing.md,
    padding: customerSpacing.lg,
    borderRadius: 20,
    backgroundColor: customerColors.card,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: customerColors.text },
  subtitle: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  tabRow: { flexDirection: 'row', gap: 10, marginTop: customerSpacing.md },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
    alignItems: 'center',
    backgroundColor: customerColors.surface,
  },
  tabBtnActive: { backgroundColor: customerColors.primary, borderColor: customerColors.primary },
  tabText: { color: customerColors.muted, fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF' },
  list: { paddingVertical: customerSpacing.md, paddingBottom: 120 },
  card: {
    backgroundColor: customerColors.card,
    borderRadius: 16,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    marginBottom: customerSpacing.md,
  },
  cardTitle: { color: customerColors.text, fontWeight: '700' },
  cardMeta: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  statusPill: {
    marginTop: customerSpacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { color: '#FFFFFF', fontWeight: '700', fontSize: 10 },
  statusSuccess: { backgroundColor: customerColors.success },
  statusWarning: { backgroundColor: customerColors.primary },
  statusDanger: { backgroundColor: customerColors.danger },
  emptyText: { color: customerColors.muted, textAlign: 'center', marginTop: 24 },
  backBtn: {
    marginBottom: customerSpacing.md,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
    alignItems: 'center',
    backgroundColor: customerColors.card,
  },
  backText: { color: customerColors.muted, fontWeight: '700' },
});
