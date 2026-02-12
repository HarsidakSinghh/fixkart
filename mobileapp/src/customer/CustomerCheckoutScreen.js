import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Alert, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { customerColors, customerSpacing } from './CustomerTheme';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeCustomerOrder, getCustomerProfile } from './customerApi';
import { useToast } from '../components/Toast';

const PREF_KEY_BASE = 'customer_billing_pref';
const DRAFT_KEY_BASE = 'customer_checkout_draft';
const PROFILE_CACHE_KEY_BASE = 'customer_profile_cache';

function withUserKey(base, userId) {
  return userId ? `${base}:${userId}` : base;
}

export default function CustomerCheckoutScreen({ onDone, onBack }) {
  const { user } = useAuth();
  const { items, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [savePref, setSavePref] = useState(true);
  const [usePref, setUsePref] = useState(false);
  const [hadSavedPref, setHadSavedPref] = useState(false);
  const [prefData, setPrefData] = useState(null);
  const draftLoaded = useRef(false);
  const toast = useToast();
  const [billing, setBilling] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    companyName: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  useEffect(() => {
    async function loadPref() {
      if (!user?.id) return;
      const prefKey = withUserKey(PREF_KEY_BASE, user.id);
      const draftKey = withUserKey(DRAFT_KEY_BASE, user.id);
      const profileCacheKey = withUserKey(PROFILE_CACHE_KEY_BASE, user.id);

      try {
        try {
          const draftRaw = await SecureStore.getItemAsync(draftKey);
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            if (draft?.billing) {
              setBilling((prev) => ({ ...prev, ...draft.billing }));
            }
            if (draft?.paymentMethod) setPaymentMethod(draft.paymentMethod);
            if (draft?.step) setStep(draft.step);
            if (typeof draft?.savePref === 'boolean') setSavePref(draft.savePref);
            if (typeof draft?.usePref === 'boolean') setUsePref(draft.usePref);
          }
        } catch {
          // ignore
        }

        const raw = await SecureStore.getItemAsync(prefKey);
        try {
          if (raw) {
            const data = JSON.parse(raw);
            setPrefData(data);
            setHadSavedPref(true);
            setUsePref(true);
            setBilling((prev) => ({ ...prev, ...data }));
            return;
          }
        } catch {
          // ignore
        }

        // fallback to user-specific profile cache when no saved pref
        try {
          const profileRaw = await SecureStore.getItemAsync(profileCacheKey);
          if (profileRaw) {
            const profile = JSON.parse(profileRaw);
            setPrefData(profile);
            setUsePref(true);
            setBilling((prev) => ({ ...prev, ...profile }));
            return;
          }
        } catch {
          // ignore
        }

        // last fallback: fetch profile
        try {
          const data = await getCustomerProfile();
          if (data?.profile) {
            setPrefData(data.profile);
            setUsePref(true);
            setBilling((prev) => ({ ...prev, ...data.profile }));
          }
        } catch {
          // ignore
        }
      } finally {
        draftLoaded.current = true;
      }
    }
    loadPref();
  }, [user?.id]);

  useEffect(() => {
    if (!draftLoaded.current || !user?.id) return;
    const draftKey = withUserKey(DRAFT_KEY_BASE, user.id);
    const payload = {
      billing,
      paymentMethod,
      step,
      savePref,
      usePref,
    };
    SecureStore.setItemAsync(draftKey, JSON.stringify(payload));
  }, [billing, paymentMethod, step, savePref, usePref, user?.id]);

  const isValid = useMemo(() => {
    return (
      billing.fullName &&
      billing.phone &&
      billing.address &&
      billing.city &&
      billing.state &&
      billing.postalCode
    );
  }, [billing]);

  const handleConfirm = async () => {
    if (!isValid) {
      Alert.alert('Missing info', 'Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    const prefKey = withUserKey(PREF_KEY_BASE, user?.id);
    const draftKey = withUserKey(DRAFT_KEY_BASE, user?.id);
    const profileCacheKey = withUserKey(PROFILE_CACHE_KEY_BASE, user?.id);

    try {
      await placeCustomerOrder({
        items: items.map((item) => ({ productId: item.id, qty: item.qty })),
        billing,
        paymentMethod,
      });
    } catch {
      toast.show('Order failed. Try again.', 'error');
      setSubmitting(false);
      return;
    }

    try {
      if (savePref) {
        await SecureStore.setItemAsync(prefKey, JSON.stringify(billing));
      }
      await SecureStore.setItemAsync(profileCacheKey, JSON.stringify(billing));
      await SecureStore.deleteItemAsync(draftKey);
    } catch (error) {
      console.error('Non-blocking checkout persistence failed', error);
    }

    try {
      clearCart();
      toast.show('Order placed successfully', 'success');
      onDone?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>Step {step} of 2</Text>
      </View>

      {step === 1 ? (
        <ScrollView style={styles.card} contentContainerStyle={styles.cardScroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.prefToggle,
              usePref && styles.prefToggleActive,
              !prefData && styles.prefToggleDisabled,
            ]}
            onPress={() => {
              if (!prefData) return;
              if (!usePref) {
                setBilling((prev) => ({ ...prev, ...prefData }));
              } else {
                setBilling({
                  fullName: '',
                  phone: '',
                  address: '',
                  city: '',
                  state: '',
                  postalCode: '',
                  companyName: '',
                });
              }
              setUsePref((prev) => !prev);
            }}
            disabled={!prefData}
          >
            <Text
              style={[
                styles.prefToggleText,
                usePref && styles.prefToggleTextActive,
                !prefData && styles.prefToggleTextDisabled,
              ]}
            >
              {prefData ? (usePref ? 'Using saved preferences' : 'Use saved preferences') : 'No saved preferences yet'}
            </Text>
          </TouchableOpacity>
          {renderInput('Full Name', 'fullName')}
          {renderInput('Phone', 'phone')}
          {renderInput('Company Name (optional)', 'companyName')}
          {renderInput('Address', 'address', true)}
          {renderInput('City', 'city')}
          {renderInput('State', 'state')}
          {renderInput('Postal Code', 'postalCode')}

          <Text style={styles.sectionLabel}>Payment Method</Text>
          <View style={styles.paymentRow}>
            {['CASH', 'BANK_TRANSFER'].map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.paymentChip, paymentMethod === method && styles.paymentChipActive]}
                onPress={() => setPaymentMethod(method)}
              >
                <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextActive]}>
                  {method === 'CASH' ? 'Cash' : 'Bank to Bank'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.prefRow}>
            <TouchableOpacity
              style={[styles.prefBox, savePref && styles.prefBoxActive]}
              onPress={() => setSavePref((prev) => !prev)}
            >
              <Text style={[styles.prefText, savePref && styles.prefTextActive]}>
                {savePref ? '✓ ' : ''}{hadSavedPref ? 'Update saved details for future orders' : 'Save details for future orders'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={() => setStep(2)}
            disabled={!isValid}
          >
            <Text style={styles.primaryText}>Next</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Order Summary</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{item.name}</Text>
                <Text style={styles.summaryMeta}>× {item.qty}</Text>
              </View>
            )}
          />
          <Text style={styles.sectionLabel}>Billing Address</Text>
          <Text style={styles.summaryText}>{formatAddress(billing)}</Text>

          <Text style={styles.sectionLabel}>Payment</Text>
          <Text style={styles.summaryText}>{paymentMethod === 'CASH' ? 'Cash' : 'Bank to Bank'}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
              <Text style={styles.secondaryText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm} disabled={submitting}>
              <Text style={styles.primaryText}>{submitting ? 'Placing…' : 'Confirm Order'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.closeBtn} onPress={onBack}>
        <Text style={styles.closeText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  function renderInput(label, key, multiline = false) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={billing[key]}
          onChangeText={(value) => setBilling((prev) => ({ ...prev, [key]: value }))}
          multiline={multiline}
          placeholderTextColor={customerColors.muted}
        />
      </View>
    );
  }
}

function formatAddress(billing) {
  return [billing.address, billing.city, billing.state, billing.postalCode].filter(Boolean).join(', ');
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
  card: {
    marginTop: customerSpacing.md,
    backgroundColor: customerColors.card,
    borderRadius: 18,
    padding: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
  },
  cardScroll: {
    paddingBottom: customerSpacing.lg,
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
  sectionLabel: { marginTop: customerSpacing.sm, fontWeight: '700', color: customerColors.text },
  paymentRow: { flexDirection: 'row', gap: customerSpacing.sm, marginTop: customerSpacing.sm },
  paymentChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: customerColors.border,
    backgroundColor: customerColors.surface,
  },
  paymentChipActive: { backgroundColor: customerColors.primary, borderColor: customerColors.primary },
  paymentText: { color: customerColors.muted, fontWeight: '700', fontSize: 11 },
  paymentTextActive: { color: '#FFFFFF' },
  primaryBtn: {
    marginTop: customerSpacing.md,
    backgroundColor: customerColors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryText: { color: '#FFFFFF', fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: customerSpacing.sm },
  summaryText: { color: customerColors.text, fontWeight: '600' },
  summaryMeta: { color: customerColors.muted, fontSize: 12 },
  prefRow: { marginTop: customerSpacing.md },
  prefBox: {
    borderWidth: 1,
    borderColor: customerColors.border,
    borderRadius: 12,
    padding: customerSpacing.sm,
    backgroundColor: customerColors.surface,
  },
  prefBoxActive: { backgroundColor: customerColors.primary },
  prefText: { color: customerColors.muted, fontSize: 12, fontWeight: '600' },
  prefTextActive: { color: '#FFFFFF' },
  prefToggle: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
    backgroundColor: customerColors.surface,
    marginBottom: customerSpacing.md,
  },
  prefToggleActive: { backgroundColor: customerColors.primary, borderColor: customerColors.primary },
  prefToggleText: { color: customerColors.muted, fontSize: 12, fontWeight: '700' },
  prefToggleTextActive: { color: '#FFFFFF' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: customerSpacing.sm },
  secondaryBtn: {
    flex: 1,
    marginTop: customerSpacing.md,
    borderWidth: 1,
    borderColor: customerColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: { color: customerColors.muted, fontWeight: '700' },
  closeBtn: {
    marginTop: customerSpacing.md,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: customerColors.border,
    backgroundColor: customerColors.card,
  },
  closeText: { color: customerColors.muted, fontWeight: '700', fontSize: 14 },
  prefToggleDisabled: { opacity: 0.6 },
  prefToggleTextDisabled: { color: customerColors.muted },
});
