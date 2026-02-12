import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getVendorComplaints, getVendorRefunds } from './vendorApi';
import StatusPill from '../components/StatusPill';

export default function VendorComplaintsScreen() {
  const [complaints, setComplaints] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const [complaintData, refundData] = await Promise.all([
        getVendorComplaints(),
        getVendorRefunds(),
      ]);
      setComplaints(complaintData.complaints || []);
      setRefunds(refundData.refunds || []);
    } catch (error) {
      console.error('Failed to load complaints', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [loadComplaints]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Support Desk</Text>
          <Text style={styles.heroSubtitle}>Complaints and refund requests</Text>
        </View>

        <Text style={styles.sectionTitle}>Complaints</Text>
        {complaints.length === 0 && !loading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No complaints right now.</Text>
          </View>
        ) : (
          complaints.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.title}>Order {item.orderId?.slice(-6).toUpperCase()}</Text>
              <Text style={styles.meta}>{item.message}</Text>
              {getComplaintImages(item).length ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                  {getComplaintImages(item).map((url, index) => (
                    <TouchableOpacity key={`${url}-${index}`} onPress={() => Linking.openURL(url)}>
                      <Image source={{ uri: url }} style={styles.attachmentImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null}
              <StatusPill label={item.status || 'OPEN'} tone={statusTone(item.status)} />
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Refund Requests</Text>
        {refunds.length === 0 && !loading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No refund requests right now.</Text>
          </View>
        ) : (
          refunds.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.title}>Refund {item.orderItemId?.slice(-6).toUpperCase()}</Text>
              <Text style={styles.meta}>{item.reason}</Text>
              <StatusPill label={item.status || 'PENDING'} tone={refundTone(item.status)} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  function getComplaintImages(item) {
    if (Array.isArray(item?.imageUrls) && item.imageUrls.length) return item.imageUrls;
    if (item?.imageUrl) return [item.imageUrl];
    return [];
  }

  function statusTone(status) {
    if (status === 'RESOLVED') return 'success';
    if (status === 'IN_REVIEW') return 'warning';
    return 'danger';
  }

  function refundTone(status) {
    if (status === 'APPROVED') return 'success';
    if (status === 'REJECTED') return 'danger';
    return 'warning';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg },
  list: { padding: vendorSpacing.lg, paddingBottom: 120 },
  heroCard: {
    marginBottom: vendorSpacing.md,
    padding: vendorSpacing.lg,
    borderRadius: 20,
    backgroundColor: vendorColors.card,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  heroTitle: { fontSize: 20, fontWeight: '800', color: vendorColors.text },
  heroSubtitle: { color: vendorColors.muted, marginTop: 6, fontSize: 12 },
  sectionTitle: {
    color: vendorColors.text,
    fontWeight: '700',
    marginBottom: vendorSpacing.sm,
    marginTop: vendorSpacing.md,
  },
  card: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.md,
  },
  title: { color: vendorColors.text, fontWeight: '700' },
  meta: { color: vendorColors.muted, marginTop: 6, fontSize: 12 },
  imageRow: { marginTop: vendorSpacing.sm, gap: 8, paddingBottom: 4 },
  attachmentImage: {
    width: 92,
    height: 92,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
  },
  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: vendorColors.muted },
});
