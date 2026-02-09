import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getPublicCategories, registerVendorWithToken } from './vendorApi';
import { useAuth } from '../context/AuthContext';
import { useSignIn, useSignUp, useAuth as useClerkAuth } from '@clerk/clerk-expo';

const DOC_TYPES = ['GST', 'PAN', 'Address Proof'];

export default function VendorRegisterScreen({ onClose }) {
  const { isAuthenticated, saveSession } = useAuth();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { getToken } = useClerkAuth();
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [docData, setDocData] = useState('');
  const [docName, setDocName] = useState('');
  const [docMime, setDocMime] = useState('');
  const [photoData, setPhotoData] = useState('');
  const [stage, setStage] = useState('email');
  const [otp, setOtp] = useState('');
  const [pendingSignIn, setPendingSignIn] = useState(null);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [verifiedToken, setVerifiedToken] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
    gpsLat: '',
    gpsLng: '',
    contactEmail: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    getPublicCategories().then((data) => setCategories(data.categories || [])).catch(() => {});
  }, []);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: ['application/pdf', 'image/*'],
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    const mime = asset.mimeType || 'application/octet-stream';
    setDocName(asset.name || 'Document');
    setDocMime(mime);
    const dataUrl = await uriToBase64(asset.uri, mime);
    setDocData(dataUrl);
  };

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

  const sendOtp = useCallback(async () => {
    const email = form.contactEmail.trim().toLowerCase();
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (verifiedEmail && verifiedEmail === email) {
      setStage('verified');
      return;
    }
    if (!signInLoaded || !signUpLoaded) {
      Alert.alert('Please wait', 'Auth service is still loading. Try again in a moment.');
      return;
    }
    setVerifying(true);
    setOtpError('');
    try {
      try {
        const signInAttempt = await signIn.create({ identifier: email });
        const emailFactor = signInAttempt.supportedFirstFactors?.find(
          (factor) => factor.strategy === 'email_code'
        );
        if (!emailFactor?.emailAddressId) {
          throw new Error('Email verification not available.');
        }
        await signInAttempt.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });
        setPendingSignIn({ type: 'signin', attempt: signInAttempt, email });
      } catch (err) {
        // If user doesn't exist, start sign-up flow
        const signUpAttempt = await signUp.create({ emailAddress: email });
        await signUpAttempt.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingSignIn({ type: 'signup', attempt: signUpAttempt, email });
      }
      setOtp('');
      setStage('code');
      Alert.alert('OTP Sent', 'Check your email for the verification code.');
    } catch (error) {
      const message = error?.errors?.[0]?.message || 'Failed to send OTP.';
      setOtpError(message);
      Alert.alert('Error', message);
    } finally {
      setVerifying(false);
    }
  }, [form.contactEmail, verifiedEmail, signInLoaded, signUpLoaded, signIn, signUp]);

  const verifyOtp = useCallback(async () => {
    if (!pendingSignIn || !otp) {
      Alert.alert('Error', 'Enter the OTP');
      return;
    }
    setVerifying(true);
    setOtpError('');
    try {
      console.log('[VendorRegister] Verifying OTP for', pendingSignIn?.email);
      const attempt = pendingSignIn.attempt;
      const result =
        pendingSignIn.type === 'signup'
          ? await attempt.attemptEmailAddressVerification({ code: otp })
          : await attempt.attemptFirstFactor({ strategy: 'email_code', code: otp });

      const isComplete = result.status === 'complete' || result.status === 'verified';
      console.log('[VendorRegister] OTP result status:', result.status, 'userId:', result.userId);

      const finalResult = await completeSignupIfNeeded(
        pendingSignIn,
        result,
        form.contactName,
        form.businessName,
        form.contactPhone
      );

      if (finalResult?.status === 'complete' || finalResult?.status === 'verified') {
        const sessionId = finalResult.createdSessionId || finalResult.sessionId;
        if (sessionId) {
          console.log('[VendorRegister] Setting active session:', sessionId);
          await setActive({ session: sessionId });
        }
        const token = await getTokenWithRetry(getToken);
        console.log('[VendorRegister] Token length after verify:', token ? token.length : 0);
        if (token) {
          setVerifiedToken(token);
          await saveSession(
            { id: finalResult.userId || result.userId, email: pendingSignIn.email, isAdmin: false },
            token,
            false
          );
        }
        setVerifiedEmail(pendingSignIn.email);
        setStage('verified');
      } else {
        const missing = finalResult?.missingFields || result?.missingFields || [];
        if (missing.length) {
          Alert.alert(
            'Additional info required',
            `Clerk requires these fields: ${missing.join(', ')}. Please update your Clerk settings to only require email OTP.`
          );
        }
        Alert.alert('Error', 'Verification failed. Please retry the OTP.');
      }
    } catch (error) {
      const message = error?.errors?.[0]?.message || 'Invalid OTP.';
      console.log('[VendorRegister] OTP error:', message);
      if (message.toLowerCase().includes('already verified')) {
        try {
          const fallback = await completeSignupIfNeeded(
            pendingSignIn,
            pendingSignIn.attempt,
            form.contactName,
            form.businessName,
            form.contactPhone
          );
          if (fallback?.status === 'complete' || fallback?.status === 'verified') {
            const sessionId = fallback.createdSessionId || fallback.sessionId;
            if (sessionId) {
              await setActive({ session: sessionId });
            }
            const token = await getTokenWithRetry(getToken);
            console.log('[VendorRegister] Token length after verify:', token ? token.length : 0);
            if (token) {
              setVerifiedToken(token);
              await saveSession(
                { id: fallback.userId, email: pendingSignIn.email, isAdmin: false },
                token,
                false
              );
            }
            setVerifiedEmail(pendingSignIn.email);
            setStage('verified');
            return;
          }
        } catch (innerErr) {
          console.log('[VendorRegister] Already verified but completion failed');
        }
        setVerifiedEmail(pendingSignIn.email);
        setStage('verified');
      } else {
        setOtpError(message);
        Alert.alert('Error', message);
      }
    } finally {
      setVerifying(false);
    }
  }, [pendingSignIn, otp, setActive, getToken, saveSession]);

  const handleSubmit = async () => {
    const email = form.contactEmail.trim().toLowerCase();
    if (!(isAuthenticated || (verifiedEmail && verifiedEmail === email))) {
      console.log('[VendorRegister] Submit blocked, verifiedEmail:', verifiedEmail, 'email:', email);
      Alert.alert('Verify Email', 'Please verify your email with OTP first.');
      return;
    }
    if (!form.businessName || !form.contactName || !form.contactPhone || !email) {
      Alert.alert('Error', 'Please fill required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        contactEmail: email,
        categories: selectedCategories,
        docType,
        docData,
        locationPhoto: photoData,
        gpsLat: form.gpsLat ? Number(form.gpsLat) : null,
        gpsLng: form.gpsLng ? Number(form.gpsLng) : null,
      };

      const token = verifiedToken || (await getTokenWithRetry(getToken));
      console.log('[VendorRegister] Submit token length:', token ? token.length : 0);
      if (!token) {
        Alert.alert('Error', 'Could not authenticate. Please verify OTP again.');
        setStage('email');
        return;
      }
      await registerVendorWithToken(token, payload);
      Alert.alert('Submitted', 'Vendor registration submitted for approval.');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit registration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Vendor Registration</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>Verify your email with OTP before submitting the registration.</Text>
        </View>
        {renderInput('Contact Email (OTP)', 'contactEmail', verifiedEmail ? true : false)}
        {stage === 'email' ? (
          <View style={styles.otpRow}>
            <TouchableOpacity style={styles.noticeBtn} onPress={sendOtp} disabled={verifying}>
              <Text style={styles.noticeBtnText}>{verifying ? 'Sending…' : 'Send OTP'}</Text>
            </TouchableOpacity>
          </View>
        ) : stage === 'code' ? (
          <View style={styles.otpRow}>
            <TextInput
              style={styles.otpInput}
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              placeholderTextColor={vendorColors.muted}
            />
            <TouchableOpacity style={styles.noticeBtn} onPress={verifyOtp} disabled={verifying}>
              <Text style={styles.noticeBtnText}>{verifying ? 'Verifying…' : 'Verify'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.verifiedRow}>
            <Text style={styles.verifiedText}>Email verified</Text>
          </View>
        )}
        {!!otpError && <Text style={styles.otpError}>{otpError}</Text>}
        {renderInput('Legal / Business Name', 'businessName')}
        {renderInput('GSTIN', 'gstNumber')}
        {renderInput('PAN', 'panNumber')}

        {renderInput('Registered Address', 'address')}
        {renderInput('City', 'city')}
        {renderInput('State', 'state')}
        {renderInput('Pincode', 'postalCode')}

        <Text style={styles.sectionTitle}>Contact Person</Text>
        {renderInput('Name', 'contactName')}
        {renderInput('Phone', 'contactPhone')}

        <Text style={styles.sectionTitle}>Product Categories</Text>
        <View style={styles.categoryWrap}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategories.includes(cat) && styles.categoryChipActive]}
              onPress={() => toggleCategory(cat)}
            >
              <Text style={[styles.categoryText, selectedCategories.includes(cat) && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Bank Details</Text>
        {renderInput('Bank Name', 'bankName')}
        {renderInput('Account Holder', 'accountHolder')}
        {renderInput('Account Number', 'accountNumber')}
        {renderInput('IFSC Code', 'ifscCode')}

        <Text style={styles.sectionTitle}>Document Upload</Text>
        <View style={styles.categoryWrap}>
          {DOC_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.categoryChip, docType === type && styles.categoryChipActive]}
              onPress={() => setDocType(type)}
            >
              <Text style={[styles.categoryText, docType === type && styles.categoryTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
          <Text style={styles.uploadText}>{docName ? `Uploaded: ${docName}` : 'Upload Document (PDF/Image)'}</Text>
        </TouchableOpacity>
        {docData && docMime.startsWith('image/') ? (
          <Image source={{ uri: docData }} style={styles.preview} />
        ) : null}
        {docData && !docMime.startsWith('image/') ? (
          <View style={styles.docMeta}>
            <Text style={styles.docMetaText}>Document ready • {docType}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>GPS & Building Photo (Optional)</Text>
        {renderInput('Latitude', 'gpsLat')}
        {renderInput('Longitude', 'gpsLng')}
        <TouchableOpacity style={styles.uploadBtn} onPress={pickPhoto}>
          <Text style={styles.uploadText}>Upload Building Photo</Text>
        </TouchableOpacity>
        {photoData ? <Image source={{ uri: photoData }} style={styles.preview} /> : null}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitText}>{submitting ? 'Submitting…' : 'Submit for Approval'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  function renderInput(label, key, disabled = false) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.input, disabled && styles.inputDisabled]}
          value={form[key]}
          onChangeText={(value) => {
            setForm((prev) => ({ ...prev, [key]: value }));
            if (key === 'contactEmail') {
              const nextEmail = value.trim().toLowerCase();
              if (verifiedEmail && verifiedEmail !== nextEmail) {
                setVerifiedEmail('');
                setVerifiedToken('');
                setStage('email');
                setPendingSignIn(null);
                setOtp('');
                setOtpError('');
              }
            }
          }}
          placeholderTextColor={vendorColors.muted}
          editable={!disabled}
        />
      </View>
    );
  }
}

async function uriToBase64(uri, mimeType) {
  const response = await fetch(uri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  return `data:${mimeType};base64,${base64}`;
}

async function getTokenWithRetry(getTokenFn) {
  const template = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE || 'mobile';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const token = await getTokenFn({ template });
    if (token) return token;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return null;
}

async function completeSignupIfNeeded(pending, result, contactName, businessName, contactPhone) {
  if (!pending || pending.type !== 'signup') return result;
  const status = result?.status || pending?.attempt?.status;
  if (status !== 'missing_requirements') return result;

  const rawName = contactName?.trim() || businessName?.trim() || 'Vendor User';
  const parts = rawName.split(' ').filter(Boolean);
  const firstName = parts[0] || 'Vendor';
  const lastName = parts.slice(1).join(' ') || 'User';

  const missing = result?.missingFields || pending?.attempt?.missingFields || [];
  const required = result?.requiredFields || pending?.attempt?.requiredFields || [];
  const unverified = result?.unverifiedFields || pending?.attempt?.unverifiedFields || [];
  console.log('[VendorRegister] Missing fields:', missing, 'Required:', required, 'Unverified:', unverified);

  const updatePayload = { firstName, lastName };
  if (
    missing.includes('phone_number') ||
    missing.includes('phoneNumber') ||
    required.includes('phone_number') ||
    required.includes('phoneNumber')
  ) {
    const normalized = normalizePhone(contactPhone);
    if (normalized) {
      updatePayload.phoneNumber = normalized;
    }
  }
  if (missing.includes('username') || required.includes('username')) {
    const base = pending.email?.split('@')[0] || 'vendor';
    updatePayload.username = `${base}_${Math.floor(Math.random() * 10000)}`;
  }

  console.log('[VendorRegister] Completing signup with payload:', updatePayload);
  const updated = await pending.attempt.update(updatePayload);
  console.log('[VendorRegister] Signup status after update:', updated.status);
  return updated;
}

function normalizePhone(input) {
  if (!input) return '';
  const digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return '';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg },
  header: {
    padding: vendorSpacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', color: vendorColors.text },
  closeText: { color: vendorColors.primary, fontWeight: '700' },
  scroll: { paddingHorizontal: vendorSpacing.lg, paddingBottom: 120 },
  sectionTitle: { marginTop: vendorSpacing.lg, fontWeight: '700', color: vendorColors.text },
  inputGroup: { marginTop: vendorSpacing.md },
  inputLabel: { color: vendorColors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 12,
    paddingHorizontal: vendorSpacing.md,
    paddingVertical: 10,
    backgroundColor: vendorColors.card,
    color: vendorColors.text,
  },
  inputDisabled: {
    backgroundColor: vendorColors.surface,
    color: vendorColors.muted,
  },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: vendorSpacing.sm },
  categoryChip: {
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: vendorColors.card,
  },
  categoryChipActive: { backgroundColor: vendorColors.primary, borderColor: vendorColors.primary },
  categoryText: { fontSize: 11, color: vendorColors.muted, fontWeight: '600' },
  categoryTextActive: { color: '#FFFFFF' },
  uploadBtn: {
    marginTop: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: vendorColors.surface,
  },
  uploadText: { color: vendorColors.primary, fontWeight: '700', fontSize: 12 },
  preview: { marginTop: vendorSpacing.sm, width: '100%', height: 160, borderRadius: 12 },
  docMeta: {
    marginTop: vendorSpacing.sm,
    padding: vendorSpacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: vendorColors.border,
    backgroundColor: vendorColors.surface,
  },
  docMetaText: { color: vendorColors.muted, fontSize: 12, fontWeight: '600' },
  submitBtn: {
    marginTop: vendorSpacing.xl,
    backgroundColor: vendorColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#FFFFFF', fontWeight: '700' },
  noticeBox: {
    backgroundColor: vendorColors.surface,
    borderRadius: 12,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  noticeText: { color: vendorColors.muted, fontSize: 12 },
  noticeBtn: {
    marginTop: vendorSpacing.sm,
    alignSelf: 'flex-start',
    backgroundColor: vendorColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  noticeBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  otpRow: { flexDirection: 'row', alignItems: 'center', gap: vendorSpacing.sm, marginTop: vendorSpacing.sm },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: vendorColors.border,
    borderRadius: 10,
    paddingHorizontal: vendorSpacing.md,
    paddingVertical: 8,
    backgroundColor: vendorColors.card,
    color: vendorColors.text,
  },
  verifiedRow: { marginTop: vendorSpacing.sm },
  verifiedText: { color: vendorColors.primary, fontWeight: '700' },
  otpError: { marginTop: vendorSpacing.sm, color: '#D9534F', fontSize: 12 },
});
