import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { customerColors, customerSpacing } from './CustomerTheme';

export default function CustomerHeader({
  query,
  onQueryChange,
  onLogin,
  onToggleMenu,
  categoryLabel,
  isAuthenticated,
  onLogout,
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.logoRow}>
          <TouchableOpacity style={styles.menuButton} onPress={onToggleMenu}>
            <Text style={styles.menuText}>☰</Text>
          </TouchableOpacity>
          <View>
            <Image source={require('../../assets/logo1.png')} style={styles.logoImage} />
            <Text style={styles.tagline}>Industrial Fasteners</Text>
          </View>
        </View>
        <View style={styles.actions}>
          {isAuthenticated ? (
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutText}>Sign out</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginButton} onPress={onLogin}>
              <Text style={styles.loginText}>Sign in</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={customerColors.muted} />
        <TextInput
          placeholder="Search products..."
          placeholderTextColor={customerColors.muted}
          value={query}
          onChangeText={onQueryChange}
          style={styles.search}
        />
        <TouchableOpacity style={styles.filterChip} onPress={onToggleMenu}>
          <Feather name="filter" size={14} color={customerColors.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.categoryRow}>
        <Text style={styles.categoryLabel}>Category</Text>
        <Text style={styles.categoryValue}>{categoryLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: customerColors.primary,
    paddingTop: customerSpacing.lg,
    paddingBottom: customerSpacing.md,
    paddingHorizontal: customerSpacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: customerSpacing.md,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: customerSpacing.sm,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  logoImage: {
    width: 120,
    height: 28,
    resizeMode: 'contain',
  },
  tagline: { color: '#DDE6FF', fontSize: 10, fontWeight: '600' },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  loginButton: {
    backgroundColor: customerColors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loginText: { color: customerColors.primaryDark, fontWeight: '700', fontSize: 11 },
  logoutButton: {
    backgroundColor: '#FFFFFF33',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF55',
  },
  logoutText: { color: '#FFFFFF', fontWeight: '700', fontSize: 11 },
  searchWrap: {
    backgroundColor: '#F7F9FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E6ECFF',
  },
  search: {
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 10,
    fontSize: 14,
    color: customerColors.text,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECFF',
  },
  categoryRow: {
    marginTop: customerSpacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLabel: {
    color: '#DDE6FF',
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  categoryValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
