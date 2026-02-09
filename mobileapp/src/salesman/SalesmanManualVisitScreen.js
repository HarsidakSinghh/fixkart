import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { salesmanColors, salesmanSpacing } from './SalesmanTheme';
import { endVisit } from './salesmanApi';

export default function SalesmanManualVisitScreen({ onBack }) {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [photoData, setPhotoData] = useState('');

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

  const handleSubmit = async () => {
    if (!companyName || !address) {
      Alert.alert('Missing info', 'Company name and address are required.');
      return;
    }
    await endVisit({
      customerId: null,
      outcome: 'Manual Visit',
      note,
      imageBase64: photoData || null,
      companyName,
      companyAddress: address,
    });
    onBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Manual Visit</Text>
        <Text style={styles.subtitle}>Log a visit that wasn’t assigned</Text>

        <Text style={styles.label}>Company Name</Text>
        <TextInput
          style={styles.input}
          value={companyName}
          onChangeText={setCompanyName}
          placeholder="Company name"
          placeholderTextColor={salesmanColors.muted}
        />

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, styles.inputNote]}
          value={address}
          onChangeText={setAddress}
          placeholder="Address"
          placeholderTextColor={salesmanColors.muted}
          multiline
        />

        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.inputNote]}
          value={note}
          onChangeText={setNote}
          placeholder="Notes"
          placeholderTextColor={salesmanColors.muted}
          multiline
        />

        <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto}>
          <Text style={styles.photoText}>{photoData ? 'Replace Photo' : 'Upload Photo'}</Text>
        </TouchableOpacity>
        {photoData ? <Image source={{ uri: photoData }} style={styles.preview} /> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Save Visit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: salesmanColors.bg, padding: salesmanSpacing.lg },
  scroll: { paddingBottom: 40 },
  backText: { color: salesmanColors.primary, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: salesmanColors.text, marginTop: salesmanSpacing.md },
  subtitle: { color: salesmanColors.muted, marginTop: 4 },
  label: { marginTop: salesmanSpacing.lg, fontWeight: '700', color: salesmanColors.text },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: salesmanColors.border,
    borderRadius: 12,
    padding: salesmanSpacing.md,
    color: salesmanColors.text,
    backgroundColor: salesmanColors.card,
  },
  inputNote: { minHeight: 90 },
  photoBtn: {
    marginTop: 12,
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
