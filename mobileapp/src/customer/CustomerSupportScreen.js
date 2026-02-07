import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { customerColors, customerSpacing } from './CustomerTheme';
import { submitComplaint, submitRefund, uploadComplaintImage } from './customerApi';
import { useToast } from '../components/Toast';

export default function CustomerSupportScreen({ order, onBack }) {
  const [mode, setMode] = useState(null); // COMPLAINT | REFUND
  const [message, setMessage] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(order?.items?.[0]?.id || '');
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const items = order?.items || [];

  const isValid = useMemo(() => {
    if (!mode) return false;
    if (!message.trim()) return false;
    if (mode === 'REFUND' && !selectedItemId) return false;
    return true;
  }, [message, mode, selectedItemId]);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  }

  async function handleSubmit() {
    if (!isValid) {
      Alert.alert('Missing info', 'Please complete the form.');
      return;
    }
    setSubmitting(true);
    try {
      let imageUrl = null;
      if (image?.base64) {
        try {
          const uploadRes = await uploadComplaintImage(image.base64, `complaint-${Date.now()}`);
          imageUrl = uploadRes?.url || null;
        } catch (_) {
          imageUrl = null;
        }
      }

      if (mode === 'REFUND') {
        await submitRefund({
          orderItemId: selectedItemId,
          reason: message,
          imageUrl,
        });
        toast.show('Refund requested', 'success');
      } else {
        await submitComplaint({
          orderId: order?.id,
          orderItemId: selectedItemId || null,
          message,
          imageUrl,
        });
        toast.show('Complaint submitted', 'success');
      }
      onBack?.();
    } catch (error) {
      Alert.alert('Failed', 'Unable to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Help & Support</Text>
        <Text style={styles.subtitle}>Order #{order?.id?.slice(-6).toUpperCase()}</Text>
        {!mode ? (
          <View style={styles.choiceRow}>
            <TouchableOpacity style={styles.choiceBtn} onPress={() => setMode('COMPLAINT')}>
              <Text style={styles.choiceText}>Make a Complaint</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.choiceBtnAlt} onPress={() => setMode('REFUND')}>
              <Text style={styles.choiceTextAlt}>Request Refund</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.modeRow}>
            <Text style={styles.modeLabel}>
              {mode === 'COMPLAINT' ? 'Complaint form' : 'Refund request'}
            </Text>
            <TouchableOpacity onPress={() => setMode(null)}>
              <Text style={styles.modeSwitch}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {mode ? (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select Item</Text>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.itemRow, selectedItemId === item.id && styles.itemRowActive]}
            onPress={() => setSelectedItemId(item.id)}
          >
            <Text style={styles.itemText}>{item.productName} × {item.quantity}</Text>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Describe the issue…"
          placeholderTextColor={customerColors.muted}
          value={message}
          onChangeText={setMessage}
          multiline
        />

        <Text style={styles.sectionTitle}>Proof (optional)</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
          <Text style={styles.uploadText}>Upload Image</Text>
        </TouchableOpacity>
        {image?.uri ? <Image source={{ uri: image.uri }} style={styles.preview} /> : null}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, (!isValid || submitting) && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || submitting}
          >
            <Text style={styles.primaryText}>{submitting ? 'Submitting…' : 'Submit'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      ) : null}
      <View style={{ height: 120 }} />
    </ScrollView>
  );
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
  modeRow: { flexDirection: 'row', gap: 10, marginTop: customerSpacing.md },
  choiceRow: { gap: 10, marginTop: customerSpacing.md },
  choiceBtn: {
    backgroundColor: customerColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  choiceBtnAlt: {
    backgroundColor: customerColors.surface,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  choiceText: { color: '#FFFFFF', fontWeight: '700' },
  choiceTextAlt: { color: customerColors.primary, fontWeight: '700' },
  modeLabel: { color: customerColors.muted, fontWeight: '600', fontSize: 12 },
  modeSwitch: { color: customerColors.primary, fontWeight: '700', fontSize: 12 },
  modeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
    backgroundColor: customerColors.card,
  },
  modeChipActive: { backgroundColor: customerColors.primary, borderColor: customerColors.primary },
  modeText: { color: customerColors.muted, fontWeight: '700', fontSize: 12 },
  modeTextActive: { color: '#FFFFFF' },
  card: {
    marginTop: customerSpacing.md,
    backgroundColor: customerColors.card,
    borderRadius: 18,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  sectionTitle: { color: customerColors.text, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  itemRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
    marginBottom: 8,
    backgroundColor: customerColors.surface,
  },
  itemRowActive: { borderColor: customerColors.primary },
  itemText: { color: customerColors.text, fontSize: 12, fontWeight: '600' },
  textArea: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: customerColors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: customerColors.text,
    backgroundColor: customerColors.card,
  },
  uploadBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: customerColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  uploadText: { color: customerColors.primary, fontWeight: '700', fontSize: 12 },
  preview: { width: '100%', height: 160, borderRadius: 12, marginTop: 10 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: customerSpacing.md },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: customerColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: { color: customerColors.muted, fontWeight: '700' },
  primaryBtn: {
    flex: 1,
    backgroundColor: customerColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
});
