import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking, Modal } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getVendorComplaints, getVendorRefunds } from './vendorApi';
import StatusPill from '../components/StatusPill';

export default function VendorComplaintsScreen({ embedded = false, hideHero = false }) {
  const [complaints, setComplaints] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

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

  const content = (
    <ScrollView
      contentContainerStyle={[styles.list, embedded && styles.listEmbedded]}
      showsVerticalScrollIndicator={false}
    >
      {!hideHero ? (
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Support Desk</Text>
          <Text style={styles.heroSubtitle}>Complaints and refund requests</Text>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Complaints</Text>
      {complaints.length === 0 && !loading ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No complaints right now.</Text>
        </View>
      ) : (
        complaints.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.title}>Order {String(item.orderId || '').slice(-6).toUpperCase()}</Text>
            <Text style={styles.meta} numberOfLines={2}>{item.message}</Text>
            <StatusPill label={item.status || 'OPEN'} tone={statusTone(item.status)} />
            <TouchableOpacity style={styles.viewDetailBtn} onPress={() => setSelectedDetail(buildComplaintDetail(item))}>
              <Text style={styles.viewDetailText}>View Detail</Text>
            </TouchableOpacity>
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
            <Text style={styles.title}>Refund {String(item.orderItemId || item.id || '').slice(-6).toUpperCase()}</Text>
            <Text style={styles.meta} numberOfLines={2}>{item.reason}</Text>
            <StatusPill label={item.status || 'PENDING'} tone={refundTone(item.status)} />
            <TouchableOpacity style={styles.viewDetailBtn} onPress={() => setSelectedDetail(buildRefundDetail(item))}>
              <Text style={styles.viewDetailText}>View Detail</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );

  const detailImages = useMemo(() => {
    if (!selectedDetail) return [];
    return Array.isArray(selectedDetail.images)
      ? selectedDetail.images.filter((url) => typeof url === 'string' && url.trim().length > 0)
      : [];
  }, [selectedDetail]);

  if (embedded) {
    return (
      <View style={styles.container}>
        {content}
        <SupportDetailModal detail={selectedDetail} images={detailImages} onClose={() => setSelectedDetail(null)} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {content}
      <SupportDetailModal detail={selectedDetail} images={detailImages} onClose={() => setSelectedDetail(null)} />
    </View>
  );

  function buildComplaintDetail(item) {
    const orderItems = Array.isArray(item?.orderItems) ? item.orderItems : [];
    return {
      type: 'Complaint',
      customerName: 'Fixkart',
      orderId: item?.order?.id || item?.orderId || '-',
      status: item?.status || 'OPEN',
      createdAt: item?.createdAt || item?.order?.createdAt || null,
      note: item?.message || '-',
      itemName: item?.item?.productName || 'Item',
      itemImage: item?.item?.image || null,
      itemQty: Number(item?.item?.quantity || 0),
      orderItems,
      images: getComplaintImages(item),
    };
  }

  function buildRefundDetail(item) {
    const proofImages = Array.isArray(item?.proofImages) ? item.proofImages : [];
    const rejectProof = Array.isArray(item?.vendorRejectionProof) ? item.vendorRejectionProof : [];
    const orderItems = Array.isArray(item?.orderItems) ? item.orderItems : [];
    return {
      type: 'Refund',
      customerName: 'Fixkart',
      orderId: item?.order?.id || item?.item?.orderId || item?.orderId || '-',
      status: item?.status || 'PENDING',
      createdAt: item?.createdAt || item?.order?.createdAt || null,
      note: item?.reason || item?.vendorRejectionReason || '-',
      itemName: item?.item?.productName || item?.productName || 'Item',
      itemImage: item?.item?.image || item?.productImage || null,
      itemQty: Number(item?.item?.quantity || item?.quantity || 0),
      orderItems,
      images: [...proofImages, ...rejectProof],
    };
  }

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

function SupportDetailModal({ detail, images, onClose }) {
  return (
    <Modal visible={!!detail} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{detail?.type || 'Support'} Detail</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.metaText}>Customer: {detail?.customerName || 'Fixkart'}</Text>
            <Text style={styles.metaText}>Order: {detail?.orderId || '-'}</Text>
            <Text style={styles.metaText}>Status: {detail?.status || '-'}</Text>
            {detail?.createdAt ? <Text style={styles.metaText}>Time: {new Date(detail.createdAt).toLocaleString()}</Text> : null}

            <Text style={styles.detailSection}>Item</Text>
            {(detail?.orderItems || []).length ? (
              <View style={styles.orderItemsWrap}>
                {detail.orderItems.map((item, index) => (
                  <View key={`${item?.id || index}`} style={styles.orderItemCard}>
                    {item?.image ? (
                      <TouchableOpacity onPress={() => Linking.openURL(item.image)}>
                        <Image source={{ uri: item.image }} style={styles.orderItemImage} />
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.orderItemImage, styles.imagePlaceholder]}>
                        <Text style={styles.placeholderText}>No image</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{item?.productName || 'Item'}</Text>
                      <Text style={styles.itemMeta}>Quantity: {Number(item?.quantity || 0)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : detail?.itemImage ? (
              <TouchableOpacity onPress={() => Linking.openURL(detail.itemImage)}>
                <Image source={{ uri: detail.itemImage }} style={styles.itemImage} />
              </TouchableOpacity>
            ) : (
              <View style={[styles.itemImage, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>No item image</Text>
              </View>
            )}
            {(detail?.orderItems || []).length ? null : (
              <>
                <Text style={styles.itemTitle}>{detail?.itemName || 'Item'}</Text>
                <Text style={styles.itemMeta}>Quantity: {Number(detail?.itemQty || 0)}</Text>
              </>
            )}

            <Text style={styles.detailSection}>Notes</Text>
            <Text style={styles.noteText}>{detail?.note || '-'}</Text>

            <Text style={styles.detailSection}>Attachments</Text>
            {images.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                {images.map((url, index) => (
                  <TouchableOpacity key={`${url}-${index}`} onPress={() => Linking.openURL(url)}>
                    <Image source={{ uri: url }} style={styles.attachmentImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>No images attached.</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg },
  list: { padding: vendorSpacing.lg, paddingBottom: 120 },
  listEmbedded: { paddingTop: vendorSpacing.sm, paddingBottom: 160 },
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
    gap: 10,
  },
  title: { color: vendorColors.text, fontWeight: '700' },
  meta: { color: vendorColors.muted, fontSize: 12 },
  viewDetailBtn: {
    marginTop: 2,
    alignSelf: 'flex-start',
    backgroundColor: vendorColors.surface,
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewDetailText: { color: vendorColors.primary, fontWeight: '700', fontSize: 12 },
  emptyWrap: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: vendorColors.muted },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: vendorColors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: vendorColors.border,
    maxHeight: '88%',
    padding: vendorSpacing.lg,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: vendorColors.text, fontSize: 18, fontWeight: '800' },
  closeText: { color: vendorColors.primary, fontWeight: '700' },
  metaText: { color: vendorColors.muted, fontSize: 12, marginTop: 6 },
  detailSection: { color: vendorColors.text, fontWeight: '700', marginTop: vendorSpacing.md, marginBottom: 8 },
  itemImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
  },
  orderItemsWrap: { gap: 10 },
  orderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.card,
  },
  orderItemImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
  },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: vendorColors.muted, fontSize: 12 },
  itemTitle: { color: vendorColors.text, fontWeight: '700', marginTop: 8 },
  itemMeta: { color: vendorColors.muted, fontSize: 12, marginTop: 4 },
  noteText: { color: vendorColors.text, fontSize: 13, lineHeight: 19 },
  imageRow: { paddingBottom: 4, gap: 10 },
  attachmentImage: {
    width: 116,
    height: 116,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
  },
});
