import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, Modal, Image, ScrollView } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import * as ImagePicker from 'expo-image-picker';
import { createVendorSalesman, getVendorSalesmen, getSalesmanVisits, getSalesmanAssignments, createSalesmanAssignment, uploadSalesmanIdProof } from './vendorApi';
import VendorSalesmanTrackScreen from './VendorSalesmanTrackScreen';

export default function VendorSalesmenScreen({ onBack }) {
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', code: '', idProofUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIdProof, setUploadingIdProof] = useState(false);
  const [idProofPreview, setIdProofPreview] = useState('');
  const [visitModal, setVisitModal] = useState(false);
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitSalesman, setVisitSalesman] = useState(null);
  const [visits, setVisits] = useState([]);
  const [assignModal, setAssignModal] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSalesman, setAssignSalesman] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignForm, setAssignForm] = useState({ companyName: '', address: '', note: '', visitDate: '' });
  const [trackSalesman, setTrackSalesman] = useState(null);

  const loadSalesmen = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendorSalesmen();
      setSalesmen(data || []);
    } catch (error) {
      console.error('Failed to load salesmen', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesmen();
  }, [loadSalesmen]);

  const handleCreate = async () => {
    if (!form.phone || !form.code) {
      Alert.alert('Missing info', 'Phone and 4-digit code are required.');
      return;
    }
    if (String(form.code).length !== 4) {
      Alert.alert('Invalid code', 'Code must be 4 digits.');
      return;
    }
    setSubmitting(true);
    try {
      await createVendorSalesman({
        name: form.name,
        phone: form.phone,
        code: String(form.code),
        idProofUrl: form.idProofUrl || null,
      });
      setForm({ name: '', phone: '', code: '', idProofUrl: '' });
      setIdProofPreview('');
      await loadSalesmen();
      Alert.alert('Salesman added', 'The salesman can now log in.');
    } catch (error) {
      Alert.alert('Failed', 'Unable to add salesman.');
    } finally {
      setSubmitting(false);
    }
  };

  const pickIdProof = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow gallery access to upload ID proof.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsEditing: true,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Failed', 'Could not read selected image.');
      return;
    }
    setUploadingIdProof(true);
    setIdProofPreview(asset.uri || '');
    try {
      const upload = await uploadSalesmanIdProof(asset.base64, `salesman-id-${Date.now()}`);
      setForm((prev) => ({ ...prev, idProofUrl: upload?.url || '' }));
      if (!upload?.url) {
        Alert.alert('Failed', 'ID proof upload failed.');
      }
    } catch (error) {
      setForm((prev) => ({ ...prev, idProofUrl: '' }));
      setIdProofPreview('');
      Alert.alert('Failed', 'ID proof upload failed.');
    } finally {
      setUploadingIdProof(false);
    }
  };

  const openVisits = async (salesman) => {
    setVisitSalesman(salesman);
    setVisitModal(true);
    setVisitLoading(true);
    try {
      const data = await getSalesmanVisits(salesman.id);
      setVisits(data);
    } catch (error) {
      setVisits([]);
    } finally {
      setVisitLoading(false);
    }
  };

  const openAssign = async (salesman) => {
    setAssignSalesman(salesman);
    setAssignModal(true);
    setAssignLoading(true);
    setAssignForm({ companyName: '', address: '', note: '', visitDate: '' });
    try {
      const data = await getSalesmanAssignments(salesman.id);
      setAssignments(data);
    } catch (error) {
      setAssignments([]);
    } finally {
      setAssignLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignForm.companyName || !assignForm.address) {
      Alert.alert('Missing info', 'Company name and address are required.');
      return;
    }
    setAssignLoading(true);
    try {
      await createSalesmanAssignment({
        salesmanId: assignSalesman.id,
        companyName: assignForm.companyName,
        address: assignForm.address,
        note: assignForm.note,
        visitDate: assignForm.visitDate,
      });
      const data = await getSalesmanAssignments(assignSalesman.id);
      setAssignments(data);
      setAssignForm({ companyName: '', address: '', note: '', visitDate: '' });
      Alert.alert('Assigned', 'Visit assigned to salesman.');
    } catch (error) {
      Alert.alert('Failed', 'Could not assign visit.');
    } finally {
      setAssignLoading(false);
    }
  };

  if (trackSalesman) {
    return <VendorSalesmanTrackScreen salesman={trackSalesman} onBack={() => setTrackSalesman(null)} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        {onBack ? (
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : null}
        <Text style={styles.title}>Salesmen</Text>
        <Text style={styles.subtitle}>Create and manage your field team</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Add Salesman</Text>
        <TextInput
          style={styles.input}
          placeholder="Full name (optional)"
          placeholderTextColor={vendorColors.muted}
          value={form.name}
          onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone number"
          placeholderTextColor={vendorColors.muted}
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => setForm((prev) => ({ ...prev, phone: v }))}
        />
        <TextInput
          style={styles.input}
          placeholder="4-digit code"
          placeholderTextColor={vendorColors.muted}
          keyboardType="number-pad"
          value={form.code}
          onChangeText={(v) => setForm((prev) => ({ ...prev, code: v }))}
          maxLength={4}
        />
        <View style={styles.idProofBlock}>
          <Text style={styles.idProofLabel}>ID Proof (optional)</Text>
          <View style={styles.idProofRow}>
            {idProofPreview ? (
              <Image source={{ uri: idProofPreview }} style={styles.idProofImage} />
            ) : (
              <View style={[styles.idProofImage, styles.idProofPlaceholder]}>
                <Text style={styles.idProofPlaceholderText}>No file</Text>
              </View>
            )}
            <TouchableOpacity style={styles.uploadProofBtn} onPress={pickIdProof} disabled={uploadingIdProof}>
              <Text style={styles.uploadProofText}>{uploadingIdProof ? 'Uploading…' : 'Upload ID Proof'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate} disabled={submitting}>
          <Text style={styles.primaryText}>{submitting ? 'Saving…' : 'Add Salesman'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.listTitle}>Registered Salesmen</Text>
      <FlatList
        data={salesmen}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadSalesmen}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.listCard}>
            <View>
              <Text style={styles.name}>{item.name || 'Unnamed'}</Text>
              <Text style={styles.meta}>{item.phone}</Text>
            </View>
            <View style={styles.rightCol}>
              <View style={styles.codePill}>
                <Text style={styles.codeText}>{item.code}</Text>
              </View>
              <TouchableOpacity style={styles.linkBtn} onPress={() => openVisits(item)}>
                <Text style={styles.linkText}>Recent Visits</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkBtn} onPress={() => openAssign(item)}>
                <Text style={styles.linkText}>Assign Visit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.trackBtn} onPress={() => setTrackSalesman(item)}>
                <Text style={styles.trackText}>Track</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No salesmen yet.</Text> : null
        }
      />

      <Modal visible={visitModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visit Proofs</Text>
              <TouchableOpacity onPress={() => setVisitModal(false)}>
                <Text style={styles.linkText}>Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{visitSalesman?.name || 'Salesman'}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {visitLoading ? (
                <Text style={styles.emptyText}>Loading visits…</Text>
              ) : visits.length ? (
                visits.map((visit) => (
                  <View key={visit.id} style={styles.visitCard}>
                    {visit.imageUrl ? (
                      <Image source={{ uri: visit.imageUrl }} style={styles.visitImage} />
                    ) : null}
                    <View style={styles.visitMeta}>
                      <Text style={styles.visitNote}>{visit.companyName || 'Visit completed'}</Text>
                      {visit.companyAddress ? (
                        <Text style={styles.visitAddress}>{visit.companyAddress}</Text>
                      ) : null}
                      {visit.note ? (
                        <Text style={styles.visitSubnote}>{visit.note}</Text>
                      ) : null}
                      <Text style={styles.visitDate}>{new Date(visit.createdAt).toLocaleString()}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No visits logged yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={assignModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Visit</Text>
              <TouchableOpacity onPress={() => setAssignModal(false)}>
                <Text style={styles.linkText}>Close</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{assignSalesman?.name || 'Salesman'}</Text>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Company</Text>
              <TextInput
                style={styles.input}
                placeholder="Company name"
                placeholderTextColor={vendorColors.muted}
                value={assignForm.companyName}
                onChangeText={(v) => setAssignForm((prev) => ({ ...prev, companyName: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Visit date (YYYY-MM-DD)"
                placeholderTextColor={vendorColors.muted}
                value={assignForm.visitDate}
                onChangeText={(v) => setAssignForm((prev) => ({ ...prev, visitDate: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                placeholderTextColor={vendorColors.muted}
                value={assignForm.address}
                onChangeText={(v) => setAssignForm((prev) => ({ ...prev, address: v }))}
              />
              <TextInput
                style={[styles.input, styles.inputNote]}
                placeholder="Note (optional)"
                placeholderTextColor={vendorColors.muted}
                value={assignForm.note}
                onChangeText={(v) => setAssignForm((prev) => ({ ...prev, note: v }))}
                multiline
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleAssign} disabled={assignLoading}>
                <Text style={styles.primaryText}>{assignLoading ? 'Assigning…' : 'Assign Visit'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.listTitle}>Recent Assignments</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {assignLoading ? (
                <Text style={styles.emptyText}>Loading assignments…</Text>
              ) : assignments.length ? (
                assignments.map((item) => (
                  <View key={item.id} style={styles.assignCard}>
                    <Text style={styles.assignTitle}>{item.companyName}</Text>
                    <Text style={styles.assignMeta}>{item.address}</Text>
                    {item.visitDate ? <Text style={styles.assignNote}>Visit: {item.visitDate}</Text> : null}
                    {item.note ? <Text style={styles.assignNote}>{item.note}</Text> : null}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No assignments yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg, paddingHorizontal: vendorSpacing.lg },
  heroCard: {
    marginTop: vendorSpacing.md,
    padding: vendorSpacing.lg,
    borderRadius: 20,
    backgroundColor: vendorColors.card,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: vendorColors.text },
  subtitle: { color: vendorColors.muted, marginTop: 6, fontSize: 12 },
  backText: { color: vendorColors.primary, fontWeight: '700', marginBottom: vendorSpacing.sm },
  card: {
    marginTop: vendorSpacing.md,
    backgroundColor: vendorColors.card,
    borderRadius: 18,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  sectionTitle: { color: vendorColors.text, fontWeight: '700', marginBottom: vendorSpacing.sm },
  input: {
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: vendorColors.text,
    backgroundColor: vendorColors.card,
    marginBottom: vendorSpacing.sm,
  },
  idProofBlock: { marginBottom: vendorSpacing.md },
  idProofLabel: { color: vendorColors.muted, fontSize: 12, marginBottom: 8 },
  idProofRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  idProofImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
  },
  idProofPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  idProofPlaceholderText: { color: vendorColors.muted, fontSize: 10, fontWeight: '600' },
  uploadProofBtn: {
    backgroundColor: vendorColors.surface,
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  uploadProofText: { color: vendorColors.primary, fontWeight: '700', fontSize: 12 },
  inputNote: { minHeight: 80 },
  primaryBtn: {
    backgroundColor: vendorColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  listTitle: { marginTop: vendorSpacing.md, color: vendorColors.text, fontWeight: '700' },
  list: { paddingVertical: vendorSpacing.sm, paddingBottom: 120 },
  listCard: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightCol: { alignItems: 'flex-end', gap: 8 },
  name: { color: vendorColors.text, fontWeight: '700' },
  meta: { color: vendorColors.muted, fontSize: 12, marginTop: 4 },
  codePill: {
    backgroundColor: vendorColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  codeText: { color: vendorColors.primary, fontWeight: '700' },
  linkBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  linkText: { color: vendorColors.primary, fontWeight: '700', fontSize: 12 },
  trackBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: vendorColors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  trackText: { color: vendorColors.primary, fontWeight: '700', fontSize: 12 },
  emptyText: { color: vendorColors.muted, textAlign: 'center', marginTop: vendorSpacing.md },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: vendorColors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: vendorSpacing.lg,
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: vendorColors.text },
  modalSubtitle: { color: vendorColors.muted, marginTop: 6, marginBottom: vendorSpacing.md },
  visitCard: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginBottom: vendorSpacing.md,
    overflow: 'hidden',
  },
  visitImage: { width: '100%', height: 180 },
  visitMeta: { padding: vendorSpacing.md },
  visitNote: { color: vendorColors.text, fontWeight: '700' },
  visitAddress: { color: vendorColors.muted, fontSize: 12, marginTop: 4 },
  visitSubnote: { color: vendorColors.muted, fontSize: 12, marginTop: 4 },
  visitDate: { color: vendorColors.muted, fontSize: 12, marginTop: 6 },
  assignCard: {
    backgroundColor: vendorColors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: vendorColors.border,
    padding: vendorSpacing.md,
    marginBottom: vendorSpacing.sm,
  },
  assignTitle: { color: vendorColors.text, fontWeight: '700' },
  assignMeta: { color: vendorColors.muted, fontSize: 12, marginTop: 4 },
  assignNote: { color: vendorColors.muted, fontSize: 12, marginTop: 4 },
});
