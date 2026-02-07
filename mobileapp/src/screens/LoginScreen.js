import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSignIn, useAuth as useClerkAuth, useUser, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useAuth as useCustomAuth } from '../context/AuthContext';
import { colors, spacing } from '../theme';
import ScreenLayout from '../components/ScreenLayout';
import { verifyVendorAccess, verifyVendorAccessWithToken } from '../vendor/vendorApi';
import { salesmanLogin } from '../salesman/salesmanApi';
import { getSessionRole } from '../services/authApi';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ mode = 'customer', onModeChange, onLoginSuccess, onClose, onRegisterVendor }) {
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { getToken, isSignedIn, signOut } = useClerkAuth();
  const { user } = useUser();
  const { saveSession, checkAdminStatus, clearSession, isAuthenticated, saveSalesmanSession } = useCustomAuth();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState('email'); // 'email' | 'code'
  const [pendingSignIn, setPendingSignIn] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [salesCode, setSalesCode] = useState('');
  const [restoring, setRestoring] = useState(false);

  const jwtTemplate = process.env.EXPO_PUBLIC_CLERK_JWT_TEMPLATE || 'mobile';
  const isSalesmanMode = mode === 'salesman';
  const isAdminMode = false;
  const isVendorMode = false;

  const syncExistingSession = useCallback(async () => {
    if (!isSignedIn || isAuthenticated) return;
    setRestoring(true);
    try {
      const token = await getToken({ template: jwtTemplate });
      if (!token) return;

      let role = 'customer';
      let email = user?.primaryEmailAddress?.emailAddress;
      try {
        const session = await getSessionRole(token);
        role = session.role || 'customer';
        email = session.email || email;
      } catch (error) {
        const isAdmin = await checkAdminStatus(email);
        if (isAdmin) role = 'admin';
      }

      const userInfo = {
        id: user?.id,
        email: email,
        isAdmin: role === 'admin',
      };

      await saveSession(userInfo, token, role === 'admin', role === 'vendor');
      onLoginSuccess(role);
    } finally {
      setRestoring(false);
    }
  }, [isSignedIn, isAuthenticated, user, checkAdminStatus, getToken, saveSession, onLoginSuccess, jwtTemplate]);

  useEffect(() => {
    syncExistingSession();
  }, [syncExistingSession]);

  const handleSendCode = useCallback(async () => {
    if (!signInLoaded || !email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (isSignedIn) {
      Alert.alert('Already signed in', 'You are already signed in. Continue to the app or sign out first.');
      return;
    }

    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({ identifier: email });

      const emailFactor = signInAttempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code'
      );

      if (!emailFactor?.emailAddressId) {
        Alert.alert('Error', 'Email verification is not available for this account.');
        return;
      }

      await signInAttempt.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });

      setPendingSignIn(signInAttempt);
      setStage('code');

      Alert.alert('OTP Sent', 'A 6-digit code has been sent to your email.');
    } catch (error) {
      console.error('Send code error:', error);
      const errorMessage = error?.errors?.[0]?.message || 'Failed to send OTP. Try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [signInLoaded, email, signIn, isSignedIn]);

  const handleVerifyCode = useCallback(async () => {
    if (!pendingSignIn || !code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const result = await pendingSignIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        const token = await getToken({ template: jwtTemplate });

        if (!token) {
          Alert.alert('Error', 'Failed to retrieve session token.');
          return;
        }

        let role = 'customer';
        try {
          const session = await getSessionRole(token);
          role = session.role || 'customer';
        } catch (error) {
          const isAdmin = await checkAdminStatus(email);
          if (isAdmin) role = 'admin';
        }

        const userInfo = {
          id: result.userId,
          email: email,
          isAdmin: role === 'admin',
        };

        await saveSession(userInfo, token, role === 'admin', role === 'vendor');
        Alert.alert('Success', 'Welcome to FixKart!');
        onLoginSuccess(role);
      } else {
        Alert.alert('Error', 'Verification failed. Please try again.');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      const errorMessage = error?.errors?.[0]?.message || 'Invalid code. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [pendingSignIn, code, email, checkAdminStatus, saveSession, onLoginSuccess, getToken, setActive, signOut, clearSession, jwtTemplate, isAdminMode, isVendorMode]);

  const handleGoogleLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const { createdSessionId } = await startOAuthFlow();
      if (!createdSessionId) {
        Alert.alert('Error', 'Google sign-in failed.');
        return;
      }
      await setActive({ session: createdSessionId });
      const token = await getToken({ template: jwtTemplate });
      if (!token) {
        Alert.alert('Error', 'Failed to retrieve session token.');
        return;
      }

      const primaryEmail = user?.primaryEmailAddress?.emailAddress || email;
      const userInfo = {
        id: user?.id,
        email: primaryEmail,
        isAdmin: false,
      };

      await saveSession(userInfo, token, false, false);
      onLoginSuccess('customer');
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Error', 'Google sign-in failed.');
    } finally {
      setIsLoading(false);
    }
  }, [startOAuthFlow, setActive, getToken, jwtTemplate, saveSession, onLoginSuccess, user, email]);

  return (
    <ScreenLayout>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
              <Text style={styles.title}>
                {isSalesmanMode ? 'FixKart Sales' : 'FixKart Sign In'}
              </Text>
            <Text style={styles.subtitle}>
              {stage === 'email'
                ? 'Sign in with email verification'
                : 'Enter the OTP sent to your email'}
            </Text>
          </View>

          {isSignedIn && !isAuthenticated ? (
            <View style={styles.noticeAlt}>
              <Text style={styles.noticeText}>Restoring your session…</Text>
              {restoring ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
              ) : (
                <TouchableOpacity style={styles.button} onPress={syncExistingSession}>
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={async () => {
                  await signOut();
                  await clearSession();
                }}
              >
                <Text style={styles.toggleText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {isSalesmanMode ? (
                <>
                  <Text style={styles.label}>Mobile Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter mobile number"
                    placeholderTextColor={colors.muted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />

                  <Text style={styles.label}>Salesperson Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter code"
                    placeholderTextColor={colors.muted}
                    value={salesCode}
                    onChangeText={setSalesCode}
                    keyboardType="number-pad"
                  />

                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={async () => {
                      setIsLoading(true);
                      try {
                        const data = await salesmanLogin(phone, salesCode);
                        await saveSalesmanSession(data.salesman, data.token);
                        Alert.alert('Success', 'Welcome back!');
                        onLoginSuccess('salesman');
                      } catch (error) {
                        Alert.alert('Error', 'Invalid login credentials.');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>Sign in</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : stage === 'email' ? (
                <>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={colors.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />

                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleSendCode}
                    disabled={isLoading || !signInLoaded}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>Send Verification Code</Text>
                    )}
                  </TouchableOpacity>

                  {!isSalesmanMode && (
                    <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
                      <Text style={styles.googleText}>Continue with Google</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  <Text style={styles.label}>Verification Code</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={colors.muted}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    textAlign="center"
                  />

                  <TouchableOpacity
                    style={[styles.button, isLoading && styles.buttonDisabled]}
                    onPress={handleVerifyCode}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color={colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>Verify & Continue</Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.toggleButton} onPress={() => setStage('email')}>
                    <Text style={styles.toggleText}>Use a different email</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.roleSwitch}>
                {!isSalesmanMode ? (
                  <TouchableOpacity onPress={() => onModeChange('salesman')}>
                    <Text style={styles.roleText}>Salesman login</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => onModeChange('customer')}>
                    <Text style={styles.roleText}>Back to customer/admin/vendor</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.registerButton} onPress={onRegisterVendor}>
                  <Text style={styles.registerText}>Register as Vendor</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>

              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  ⚠️ Admin access is granted automatically for approved emails.
                </Text>
                <Text style={styles.noticeSubtext}>
                  Vendor accounts are detected automatically after approval.
                </Text>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.muted,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleText: {
    color: colors.text,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  roleSwitch: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  roleText: {
    color: colors.info,
    fontSize: 13,
    fontWeight: '600',
  },
  registerButton: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  registerText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  closeButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeText: {
    color: colors.muted,
    fontSize: 12,
  },
  notice: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  noticeAlt: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  noticeSubtext: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
