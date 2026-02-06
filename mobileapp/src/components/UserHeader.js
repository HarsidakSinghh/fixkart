import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, spacing, shadow } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';

export default function UserHeader({ showLogout = true }) {
  const { user, isAdmin, isVendor, clearSession } = useAuth();
  const { signOut } = useClerkAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      await clearSession();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) return null;

  return (
    <View style={[styles.container, shadow.soft]}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.email ? user.email[0].toUpperCase() : 'A'}
          </Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user.email}
          </Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {isAdmin ? 'ADMIN' : isVendor ? 'VENDOR' : 'USER'}
            </Text>
          </View>
        </View>
      </View>

      {showLogout && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.panelAlt,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: '#0B1020',
    fontSize: 18,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
  userEmail: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.line,
  },
  badgeText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  logoutButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.panel,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
  },
  logoutText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
});
