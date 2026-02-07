import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { customerColors, customerSpacing } from './CustomerTheme';
import { getCustomerProfile, updateCustomerProfile } from './customerApi';
import { useAuth } from '../context/AuthContext';

export default function CustomerProfileScreen({ onOpenSupportHistory, onOpenNotifications }) {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [savedBilling, setSavedBilling] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomerProfile();
      setProfile(data.profile || null);
      setForm(data.profile || {});
      try {
        await SecureStore.setItemAsync('customer_profile_cache', JSON.stringify(data.profile || {}));
      } catch (_) {
        // ignore
      }
      try {
        const notifRaw = await SecureStore.getItemAsync('customer_notifications');
        if (notifRaw) setNotifications(JSON.parse(notifRaw));
      } catch (_) {
        // ignore
      }
      try {
        const saved = await SecureStore.getItemAsync('customer_billing_pref');
        if (saved) setSavedBilling(JSON.parse(saved));
      } catch (_) {
        // ignore
      }
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [loadProfile, isAuthenticated]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={customerColors.primary} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Sign in to view your profile.</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>No profile found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>{profile.fullName || 'Customer'}</Text>
        <Text style={styles.subtitle}>{profile.email || ''}</Text>
        <Text style={styles.subtitle}>{profile.phone || ''}</Text>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing((prev) => !prev)}>
            <Text style={styles.editText}>{editing ? 'Cancel' : 'Update Profile'}</Text>
          </TouchableOpacity>
          {onOpenSupportHistory ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onOpenSupportHistory}>
              <Text style={styles.secondaryText}>Complaints & Refunds</Text>
            </TouchableOpacity>
          ) : null}
          {onOpenNotifications ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onOpenNotifications}>
              <Text style={styles.secondaryText}>Notifications</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {editing ? (
        <View style={styles.card}>
          {renderInput('Full Name', 'fullName')}
          {renderInput('Company Name', 'companyName')}
          {renderInput('Email', 'email')}
          {renderInput('Phone', 'phone')}
          {renderInput('Address', 'address', true)}
          {renderInput('City', 'city')}
          {renderInput('State', 'state')}
          {renderInput('Postal Code', 'postalCode')}
          {renderInput('Category', 'category')}
          {renderInput('Business Type', 'businessType')}
          {renderInput('Years in Business', 'yearsInBusiness')}
          {renderInput('GST', 'gstNumber')}
          {renderInput('PAN', 'panNumber')}
          {renderInput('Trade License', 'tradeLicense')}
          {renderInput('Bank Name', 'bankName')}
          {renderInput('Account Holder', 'accountHolder')}
          {renderInput('Account Number', 'accountNumber')}
          {renderInput('IFSC', 'ifscCode')}

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              try {
                const res = await updateCustomerProfile(form);
                setProfile(res.profile || form);
                try {
                  await SecureStore.setItemAsync('customer_profile_cache', JSON.stringify(res.profile || form));
                } catch (_) {
                  // ignore
                }
                setEditing(false);
                Alert.alert('Updated', 'Profile updated successfully.');
              } catch (error) {
                Alert.alert('Error', 'Unable to update profile.');
              }
            }}
          >
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <InfoSection title="Address">
            <InfoRow label="Address" value={formatAddress(profile)} />
          </InfoSection>

          <InfoSection title="Business">
            <InfoRow label="Company" value={profile.companyName} />
            <InfoRow label="Category" value={profile.category} />
            <InfoRow label="GST" value={profile.gstNumber} />
            <InfoRow label="PAN" value={profile.panNumber} />
          </InfoSection>

          <InfoSection title="Bank">
            <InfoRow label="Bank" value={profile.bankName} />
            <InfoRow label="Account Holder" value={profile.accountHolder} />
            <InfoRow label="Account Number" value={profile.accountNumber} />
            <InfoRow label="IFSC" value={profile.ifscCode} />
          </InfoSection>

          <InfoSection title="Saved Checkout Preferences">
            {savedBilling ? (
              <>
                <InfoRow label="Name" value={savedBilling.fullName} />
                <InfoRow label="Phone" value={savedBilling.phone} />
                <InfoRow label="Address" value={formatAddress(savedBilling)} />
              </>
            ) : (
              <Text style={styles.noticeText}>No saved preferences yet.</Text>
            )}
          </InfoSection>

          <InfoSection title="Notifications">
            {notifications.length === 0 ? (
              <Text style={styles.noticeText}>No recent notifications.</Text>
            ) : (
              notifications.slice(0, 3).map((n) => (
                <View key={n.id} style={styles.noteRow}>
                  <Text style={styles.noteTitle}>{n.title}</Text>
                  <Text style={styles.noteMessage}>{n.message}</Text>
                </View>
              ))
            )}
          </InfoSection>
        </>
      )}
      <View style={{ height: 120 }} />
    </ScrollView>
  );

  function renderInput(label, key, multiline = false) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={form[key] || ''}
          onChangeText={(value) => setForm((prev) => ({ ...prev, [key]: value }))}
          multiline={multiline}
          placeholderTextColor={customerColors.muted}
        />
      </View>
    );
  }
}

function InfoSection({ title, children }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value || '—'}</Text>
    </View>
  );
}

function formatAddress(profile) {
  const parts = [profile.address, profile.city, profile.state, profile.postalCode].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
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
    shadowColor: customerColors.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '800', color: customerColors.text },
  subtitle: { color: customerColors.muted, marginTop: 6, fontSize: 12 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: customerSpacing.md, flexWrap: 'wrap' },
  editBtn: {
    marginTop: customerSpacing.md,
    alignSelf: 'flex-start',
    backgroundColor: customerColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  editText: { color: customerColors.primary, fontWeight: '700', fontSize: 12 },
  secondaryBtn: {
    marginTop: customerSpacing.md,
    alignSelf: 'flex-start',
    backgroundColor: customerColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  secondaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  card: {
    backgroundColor: customerColors.card,
    borderRadius: 18,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    marginTop: customerSpacing.md,
  },
  inputGroup: { marginBottom: customerSpacing.md },
  inputLabel: { color: customerColors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: customerColors.border,
    borderRadius: 12,
    paddingHorizontal: customerSpacing.md,
    paddingVertical: 10,
    color: customerColors.text,
    backgroundColor: customerColors.card,
  },
  inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
  saveBtn: {
    marginTop: customerSpacing.sm,
    backgroundColor: customerColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { color: customerColors.text, fontWeight: '700', marginBottom: customerSpacing.sm },
  sectionBody: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: customerColors.muted, fontSize: 12, flex: 1 },
  rowValue: { color: customerColors.text, fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: customerColors.muted },
  noticeText: { color: customerColors.muted, fontSize: 12 },
  noteRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: customerColors.border,
  },
  noteTitle: { color: customerColors.text, fontWeight: '700', fontSize: 12 },
  noteMessage: { color: customerColors.muted, marginTop: 4, fontSize: 11 },
});
