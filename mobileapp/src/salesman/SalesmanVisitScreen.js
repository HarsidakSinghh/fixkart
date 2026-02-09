import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { salesmanColors, salesmanSpacing } from './SalesmanTheme';
import { endVisit } from './salesmanApi';

const OUTCOMES = ['Order Placed', 'Follow-up Required', 'Not Interested'];

export default function SalesmanVisitScreen({ beat, onBack }) {
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [photoData, setPhotoData] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      base64: true,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.base64) return;
    setPhotoData(`data:image/jpeg;base64,${asset.base64}`);
  };

  const handleEnd = async () => {
    await endVisit({
      customerId: beat.id,
      outcome,
      note,
      imageBase64: photoData || null,
      companyName: beat.name,
      companyAddress: beat.address,
      followUpDate: outcome === 'Follow-up Required' ? followUpDate || null : null,
    });
    onBack();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{beat.name}</Text>
      <Text style={styles.subtitle}>{beat.city} • {beat.address}</Text>

      <Text style={styles.label}>Visit Outcome</Text>
      <View style={styles.outcomeRow}>
        {OUTCOMES.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.outcomeChip, outcome === item && styles.outcomeChipActive]}
            onPress={() => setOutcome(item)}
          >
            <Text style={[styles.outcomeText, outcome === item && styles.outcomeTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="Capture visit notes..."
        placeholderTextColor={salesmanColors.muted}
        multiline
      />

      {outcome === 'Follow-up Required' ? (
        <>
          <Text style={styles.label}>Follow-up Date</Text>
          <TextInput
            style={styles.input}
            value={followUpDate}
            onChangeText={setFollowUpDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={salesmanColors.muted}
          />
        </>
      ) : null}

      <Text style={styles.label}>Visit Photo (optional)</Text>
      <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
        <Text style={styles.photoText}>{photoData ? 'Replace Photo' : 'Upload Photo'}</Text>
      </TouchableOpacity>
      {photoData ? <Image source={{ uri: photoData }} style={styles.preview} /> : null}

      <TouchableOpacity style={styles.submitButton} onPress={handleEnd}>
        <Text style={styles.submitText}>End Visit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: salesmanColors.bg, padding: salesmanSpacing.lg },
  backText: { color: salesmanColors.primary, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: salesmanColors.text, marginTop: salesmanSpacing.md },
  subtitle: { color: salesmanColors.muted, marginTop: 4 },
  label: { marginTop: salesmanSpacing.lg, fontWeight: '700', color: salesmanColors.text },
  outcomeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  outcomeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: salesmanColors.border,
    backgroundColor: salesmanColors.card,
  },
  outcomeChipActive: { backgroundColor: salesmanColors.primary },
  outcomeText: { color: salesmanColors.muted, fontSize: 11, fontWeight: '600' },
  outcomeTextActive: { color: '#FFFFFF' },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: salesmanColors.border,
    borderRadius: 12,
    padding: salesmanSpacing.md,
    minHeight: 120,
    color: salesmanColors.text,
    backgroundColor: salesmanColors.card,
  },
  photoBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: salesmanColors.border,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: salesmanColors.card,
  },
  photoText: { color: salesmanColors.primary, fontWeight: '700' },
  preview: { marginTop: 10, width: '100%', height: 180, borderRadius: 12 },
  submitButton: {
    marginTop: salesmanSpacing.lg,
    backgroundColor: salesmanColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontWeight: '700' },
});
