import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { customerColors, customerSpacing } from './CustomerTheme';
import { getCustomerOrders, getCustomerProfile, updateCustomerProfile, uploadCustomerProfilePhoto } from './customerApi';
import { useAuth } from '../context/AuthContext';

const PROFILE_CACHE_KEY_BASE = 'customer_profile_cache';
const REQUIRED_PROFILE_FIELDS = ['fullName', 'phone', 'address', 'city', 'state', 'postalCode'];

function withUserKey(base, userId) {
  return userId ? `${base}:${userId}` : base;
}

export default function CustomerProfileScreen({ forceComplete = false, onCompleted, onCancel }) {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(forceComplete);
  const [form, setForm] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [recentOrders, setRecentOrders] = useState([]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCustomerProfile();
      const nextProfile = data.profile || null;
      setProfile(nextProfile);
      setForm(nextProfile || {});
      try {
        const profileCacheKey = withUserKey(PROFILE_CACHE_KEY_BASE, user?.id);
        await SecureStore.setItemAsync(profileCacheKey, JSON.stringify(nextProfile || {}));
      } catch {
        // ignore cache failures
      }
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [loadProfile, isAuthenticated]);

  useEffect(() => {
    if (forceComplete) {
      setEditing(true);
    }
  }, [forceComplete]);

  useEffect(() => {
    let mounted = true;
    async function loadRecentOrders() {
      try {
        const data = await getCustomerOrders();
        if (!mounted) return;
        setRecentOrders((data.orders || []).slice(0, 3));
      } catch {
        if (!mounted) return;
        setRecentOrders([]);
      }
    }
    if (isAuthenticated) loadRecentOrders();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated]);

  const initials = useMemo(() => getInitials(profile?.fullName || profile?.companyName || 'CU'), [profile]);
  const completion = useMemo(() => getCompletion(profile), [profile]);
  const showCompletion = forceComplete || completion.percent < 100;

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
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroGlow} />
        <View style={styles.heroTop}>
          <View style={styles.avatarWrap}>
            {profile?.ownerPhotoUrl ? (
              <Image source={{ uri: profile.ownerPhotoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>{profile.fullName || 'Customer'}</Text>
            <View style={styles.identityRow}>
              <Feather name="mail" size={12} color="#B9D4FF" />
              <Text style={styles.identityText} numberOfLines={1} ellipsizeMode="tail">
                {profile.email || '—'}
              </Text>
            </View>
            <View style={styles.identityRow}>
              <Feather name="phone" size={12} color="#B9D4FF" />
              <Text style={styles.identityText}>{profile.phone || '—'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.photoBtn} disabled={uploadingPhoto} onPress={handlePhotoUpload}>
          <Feather name="camera" size={13} color="#D7E7FF" />
          <Text style={styles.photoBtnText}>{uploadingPhoto ? 'Uploading...' : 'Upload Profile Photo'}</Text>
        </TouchableOpacity>

        {showCompletion ? (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Profile Completion</Text>
              <Text style={styles.progressValue}>{completion.percent}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion.percent}%` }]} />
            </View>
            <Text style={styles.progressHint}>{completion.completed}/{completion.total} required fields complete</Text>
          </View>
        ) : null}

        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => !forceComplete && setEditing((prev) => !prev)}
          >
            <Feather name={editing ? 'x' : 'edit-3'} size={14} color="#0C1E43" />
            <Text style={styles.primaryText}>
              {forceComplete ? 'Complete Profile' : editing ? 'Cancel Edit' : 'Update Profile'}
            </Text>
          </TouchableOpacity>
          {forceComplete && onCancel ? (
            <TouchableOpacity style={styles.ghostBtn} onPress={onCancel}>
              <Feather name="arrow-left" size={14} color="#D7E7FF" />
              <Text style={styles.ghostText}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {forceComplete ? (
        <View style={styles.forceBanner}>
          <Feather name="alert-circle" size={16} color={customerColors.primary} />
          <Text style={styles.forceText}>Please complete the required profile details to continue.</Text>
        </View>
      ) : null}

      {editing ? (
        <View style={styles.formCard}>
          <FormSection title="Basic Details" />
          {renderInput('Full Name', 'fullName')}
          {renderInput('Company Name', 'companyName')}
          {renderInput('Email', 'email')}
          {renderInput('Phone', 'phone')}
          {renderInput('Address', 'address', true)}
          {renderInput('City', 'city')}
          {renderInput('State', 'state')}
          {renderInput('Postal Code', 'postalCode')}

          <FormSection title="Business Details" />
          {renderInput('Category', 'category')}
          {renderInput('Business Type', 'businessType')}
          {renderInput('Years in Business', 'yearsInBusiness')}
          {renderInput('GST', 'gstNumber')}
          {renderInput('PAN', 'panNumber')}
          {renderInput('Trade License', 'tradeLicense')}

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              try {
                const res = await updateCustomerProfile(form);
                const next = res.profile || form;
                setProfile(next);
                try {
                  const profileCacheKey = withUserKey(PROFILE_CACHE_KEY_BASE, user?.id);
                  await SecureStore.setItemAsync(profileCacheKey, JSON.stringify(next));
                } catch {
                  // ignore cache failures
                }
                if (forceComplete && onCompleted) {
                  onCompleted();
                } else {
                  setEditing(false);
                }
                Alert.alert('Updated', forceComplete ? 'Profile completed.' : 'Profile updated successfully.');
              } catch {
                Alert.alert('Error', 'Unable to update profile.');
              }
            }}
          >
            <Feather name="check" size={16} color="#FFFFFF" />
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <InfoSection title="Contact">
            <InfoRow icon="mail" label="Email" value={profile.email} oneLine />
            <InfoRow icon="phone" label="Phone" value={profile.phone} />
            <InfoRow icon="map-pin" label="Address" value={formatAddress(profile)} />
          </InfoSection>

          <InfoSection title="Business">
            <InfoRow icon="briefcase" label="Company" value={profile.companyName} />
            <InfoRow icon="layers" label="Category" value={profile.category} />
            <InfoRow icon="tag" label="Type" value={profile.businessType} />
            <InfoRow icon="clock" label="Years" value={profile.yearsInBusiness} />
            <InfoRow icon="file-text" label="GST" value={profile.gstNumber} />
            <InfoRow icon="credit-card" label="PAN" value={profile.panNumber} />
            <InfoRow icon="award" label="Trade License" value={profile.tradeLicense} />
          </InfoSection>

          <InfoSection title="Recent Orders">
            {recentOrders.length === 0 ? (
              <Text style={styles.emptyOrdersText}>No recent orders.</Text>
            ) : (
              recentOrders.map((order) => (
                <View key={order.id} style={styles.orderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.orderId}>#{String(order.id).slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderMeta}>{new Date(order.createdAt).toDateString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.orderTotal}>₹{Math.round(order.totalAmount || 0)}</Text>
                    <Text style={styles.orderStatus}>{order.status || 'PENDING'}</Text>
                  </View>
                </View>
              ))
            )}
          </InfoSection>
        </>
      )}
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

  async function handlePhotoUpload() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow gallery access to upload your profile photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.75,
      base64: true,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Failed', 'Could not read selected image.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const upload = await uploadCustomerProfilePhoto(asset.base64, `customer-profile-${Date.now()}`);
      const url = upload?.url || '';
      if (!url) throw new Error('Upload failed');

      const updatedPayload = { ...form, ownerPhotoUrl: url };
      const res = await updateCustomerProfile(updatedPayload);
      const next = res.profile || { ...(profile || {}), ownerPhotoUrl: url };
      setProfile(next);
      setForm(next);
      try {
        const profileCacheKey = withUserKey(PROFILE_CACHE_KEY_BASE, user?.id);
        await SecureStore.setItemAsync(profileCacheKey, JSON.stringify(next));
      } catch {
        // ignore cache failures
      }
    } catch {
      Alert.alert('Failed', 'Unable to upload profile photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }
}

function FormSection({ title }) {
  return <Text style={styles.formSectionTitle}>{title}</Text>;
}

function InfoSection({ title, children }) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function InfoRow({ icon, label, value, oneLine = false }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Feather name={icon} size={13} color={customerColors.muted} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={oneLine ? 1 : 2} ellipsizeMode="tail">
        {value || '—'}
      </Text>
    </View>
  );
}

function formatAddress(profile) {
  const parts = [profile.address, profile.city, profile.state, profile.postalCode].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function getInitials(name = '') {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'CU';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getCompletion(profile) {
  const source = profile || {};
  const completed = REQUIRED_PROFILE_FIELDS.filter((field) => String(source[field] || '').trim().length > 0).length;
  const total = REQUIRED_PROFILE_FIELDS.length;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: customerColors.bg },
  containerContent: {
    paddingHorizontal: customerSpacing.lg,
    paddingTop: customerSpacing.md,
    paddingBottom: 120,
  },
  heroCard: {
    borderRadius: 24,
    padding: customerSpacing.lg,
    backgroundColor: '#0F2A5F',
    borderWidth: 1,
    borderColor: '#1C3D7F',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#2F62C7',
    right: -50,
    top: -60,
    opacity: 0.5,
  },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A3D7D',
    borderWidth: 1,
    borderColor: '#2F62C7',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 25 },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
  identityText: { color: '#D7E7FF', fontSize: 12, flexShrink: 1 },
  photoBtn: {
    marginTop: customerSpacing.sm,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#2E5499',
    backgroundColor: '#1A3D7D',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoBtnText: { color: '#D7E7FF', fontWeight: '700', fontSize: 11 },
  progressCard: {
    marginTop: customerSpacing.md,
    borderWidth: 1,
    borderColor: '#2A4E96',
    backgroundColor: '#153470',
    borderRadius: 14,
    padding: customerSpacing.sm,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: '#D7E7FF', fontSize: 11, fontWeight: '700' },
  progressValue: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  progressTrack: {
    marginTop: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2A4E96',
    overflow: 'hidden',
  },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: '#7AD3A8' },
  progressHint: { color: '#B9D4FF', marginTop: 6, fontSize: 10 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: customerSpacing.md, flexWrap: 'wrap' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFE08A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
  },
  primaryText: { color: '#0C1E43', fontWeight: '800', fontSize: 12 },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2E5499',
    backgroundColor: '#1A3D7D',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 11,
  },
  ghostText: { color: '#D7E7FF', fontWeight: '700', fontSize: 12 },
  forceBanner: {
    marginTop: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    backgroundColor: customerColors.card,
    borderRadius: 14,
    padding: customerSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  forceText: { color: customerColors.text, fontSize: 12, flex: 1 },
  formCard: {
    marginTop: customerSpacing.md,
    backgroundColor: customerColors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: customerColors.border,
    padding: customerSpacing.md,
  },
  formSectionTitle: {
    color: customerColors.text,
    fontWeight: '800',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  inputGroup: { marginBottom: customerSpacing.md },
  inputLabel: { color: customerColors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: customerColors.border,
    borderRadius: 12,
    paddingHorizontal: customerSpacing.md,
    paddingVertical: 11,
    color: customerColors.text,
    backgroundColor: customerColors.surface,
  },
  inputMultiline: { minHeight: 84, textAlignVertical: 'top' },
  saveBtn: {
    marginTop: customerSpacing.sm,
    backgroundColor: customerColors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  infoCard: {
    marginTop: customerSpacing.md,
    backgroundColor: customerColors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: customerColors.border,
    padding: customerSpacing.md,
  },
  sectionTitle: { color: customerColors.text, fontWeight: '800', marginBottom: customerSpacing.sm },
  sectionBody: { gap: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: customerColors.border,
    paddingBottom: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  rowLabel: { color: customerColors.muted, fontSize: 12 },
  rowValue: { color: customerColors.text, fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  emptyOrdersText: { color: customerColors.muted, fontSize: 12 },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: customerColors.border,
    backgroundColor: customerColors.surface,
    borderRadius: 12,
    padding: 10,
  },
  orderId: { color: customerColors.text, fontWeight: '700', fontSize: 12 },
  orderMeta: { color: customerColors.muted, fontSize: 11, marginTop: 4 },
  orderTotal: { color: customerColors.text, fontWeight: '800', fontSize: 13 },
  orderStatus: { color: customerColors.primary, fontWeight: '700', fontSize: 11, marginTop: 4 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: customerColors.muted },
});
