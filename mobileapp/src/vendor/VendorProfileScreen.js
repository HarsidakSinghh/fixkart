import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Image, ScrollView } from 'react-native';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getVendorProfile } from './vendorApi';
import * as SecureStore from 'expo-secure-store';
import StatusPill from '../components/StatusPill';

export default function VendorProfileScreen({ onStatusLoaded, onOpenNotifications, onOpenPushDebug }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVendorProfile();
      setProfile(data.vendor || null);
      onStatusLoaded?.(data.vendor?.status || 'PENDING');
      try {
        const notifRaw = await SecureStore.getItemAsync('vendor_notifications');
        if (notifRaw) setNotifications(JSON.parse(notifRaw));
      } catch (_) {
        // ignore
      }
    } catch (error) {
      console.error('Failed to load vendor profile', error);
    } finally {
      setLoading(false);
    }
  }, [onStatusLoaded]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={vendorColors.primary} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>No vendor profile found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>{profile.companyName || profile.fullName}</Text>
        <Text style={styles.subtitle}>{profile.email}</Text>
        <Text style={styles.subtitle}>{profile.phone}</Text>
        <StatusPill label={profile.status} tone={statusTone(profile.status)} />
        {onOpenNotifications ? (
          <TouchableOpacity style={styles.notifyBtn} onPress={onOpenNotifications}>
            <Text style={styles.notifyText}>Notifications</Text>
          </TouchableOpacity>
        ) : null}
        {onOpenPushDebug ? (
          <TouchableOpacity style={styles.notifyBtn} onPress={onOpenPushDebug}>
            <Text style={styles.notifyText}>Push Debug</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <InfoSection title="Contact">
        <InfoRow label="Full Name" value={profile.fullName} />
        <InfoRow label="Email" value={profile.email} />
        <InfoRow label="Phone" value={profile.phone} />
        <InfoRow label="Address" value={formatAddress(profile)} />
      </InfoSection>

      <InfoSection title="Business">
        <InfoRow label="GST" value={profile.gstNumber} />
        <InfoRow label="Category" value={profile.category} />
        <InfoRow label="Business Type" value={profile.businessType} />
        <InfoRow label="Years In Business" value={profile.yearsInBusiness} />
        <InfoRow label="Trade License" value={profile.tradeLicense} />
        <InfoRow label="ID Proof" value={formatIdProof(profile)} />
      </InfoSection>

      <InfoSection title="Bank">
        <InfoRow label="Bank" value={profile.bankName} />
        <InfoRow label="Account Holder" value={profile.accountHolder} />
        <InfoRow label="Account Number" value={profile.accountNumber} />
        <InfoRow label="IFSC" value={profile.ifscCode} />
      </InfoSection>

      <InfoSection title="Location">
        <InfoRow label="GPS" value={formatGps(profile)} />
      </InfoSection>

      <InfoSection title="Documents">
        <DocRow label="GST" uri={profile.gstCertificateUrl} />
        <DocRow label="PAN" uri={profile.panCardUrl} />
        <DocRow label="ID Proof" uri={profile.idProofUrl} />
        <DocRow label="Location Photo" uri={profile.locationPhotoUrl} />
      </InfoSection>

      <InfoSection title="Notifications">
        {notifications.length === 0 ? (
          <Text style={styles.noticeText}>No recent notifications.</Text>
        ) : (
          notifications.map((n) => (
            <View key={n.id} style={styles.noteRow}>
              <Text style={styles.noteTitle}>{n.title}</Text>
              <Text style={styles.noteMessage}>{n.message}</Text>
            </View>
          ))
        )}
      </InfoSection>
      <View style={{ height: 120 }} />
    </ScrollView>
  );

  function statusTone(status) {
    if (status === 'APPROVED') return 'success';
    if (status === 'PENDING') return 'warning';
    if (status === 'REJECTED') return 'danger';
    return 'warning';
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

function DocRow({ label, uri }) {
  const isPdf = uri?.toLowerCase().endsWith('.pdf') || uri?.includes('application/pdf');
  return (
    <TouchableOpacity
      style={styles.docRow}
      disabled={!uri}
      onPress={() => uri && Linking.openURL(uri)}
    >
      <View style={styles.docThumb}>
        {uri ? (
          isPdf ? (
            <Text style={styles.docThumbText}>PDF</Text>
          ) : (
            <Image source={{ uri }} style={styles.docImage} />
          )
        ) : (
          <Text style={styles.docThumbText}>—</Text>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.docLabel}>{label}</Text>
        <Text style={styles.docAction}>{uri ? 'View Document' : 'Not provided'}</Text>
      </View>
    </TouchableOpacity>
  );
}

function formatAddress(profile) {
  const parts = [profile.address, profile.city, profile.state, profile.postalCode].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function formatIdProof(profile) {
  if (!profile.idProofType && !profile.idProofNumber) return '—';
  return `${profile.idProofType || 'ID'} ${profile.idProofNumber || ''}`.trim();
}

function formatGps(profile) {
  if (profile.gpsLat == null || profile.gpsLng == null) return '—';
  return `${profile.gpsLat}, ${profile.gpsLng}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg, paddingHorizontal: vendorSpacing.lg, paddingBottom: 120 },
  heroCard: {
    marginTop: vendorSpacing.md,
    padding: vendorSpacing.lg,
    borderRadius: 20,
    backgroundColor: vendorColors.card,
    borderWidth: 1,
    borderColor: vendorColors.border,
    shadowColor: vendorColors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: '800', color: vendorColors.text },
  subtitle: { color: vendorColors.muted, marginTop: 6, fontSize: 12 },
  notifyBtn: {
    marginTop: vendorSpacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: vendorColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  notifyText: { color: vendorColors.primary, fontWeight: '700', fontSize: 11 },
  card: {
    backgroundColor: vendorColors.card,
    borderRadius: 18,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    marginTop: vendorSpacing.md,
  },
  sectionTitle: { color: vendorColors.text, fontWeight: '700', marginBottom: vendorSpacing.sm },
  sectionBody: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: vendorColors.muted, fontSize: 12, flex: 1 },
  rowValue: { color: vendorColors.text, fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: vendorSpacing.md,
    paddingVertical: vendorSpacing.sm,
  },
  docThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  docThumbText: { color: vendorColors.muted, fontSize: 12, fontWeight: '700' },
  docImage: { width: '100%', height: '100%' },
  docLabel: { color: vendorColors.text, fontWeight: '700' },
  docAction: { color: vendorColors.primary, fontSize: 12, marginTop: 4 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: vendorColors.muted },
  noticeText: { color: vendorColors.muted, fontSize: 12 },
  noteRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: vendorColors.border,
  },
  noteTitle: { color: vendorColors.text, fontWeight: '700', fontSize: 12 },
  noteMessage: { color: vendorColors.muted, marginTop: 4, fontSize: 11 },
});
