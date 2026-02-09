import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { salesmanColors, salesmanSpacing } from './SalesmanTheme';
import { getSalesmanDashboard, getSalesmanBeats, startDay, endDay, startVisit } from './salesmanApi';
import { useAuth } from '../context/AuthContext';

export default function SalesmanDashboardScreen({ onOpenVisit, onOpenManual }) {
  const [status, setStatus] = useState('NOT_STARTED');
  const [stats, setStats] = useState({});
  const [beats, setBeats] = useState([]);
  const { clearSession } = useAuth();

  const loadData = useCallback(async () => {
    const dashboard = await getSalesmanDashboard();
    setStatus(dashboard.status);
    setStats(dashboard.stats || {});
    const beatData = await getSalesmanBeats();
    setBeats(beatData.beats || []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStartDay = async () => {
    await startDay();
    await loadData();
  };

  const handleEndDay = async () => {
    await endDay();
    await loadData();
  };

  const handleStartVisit = async (beat) => {
    await startVisit({ customerId: beat.id });
    onOpenVisit(beat);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Salesman Home</Text>
          <Text style={styles.subtitle}>Plan your day and log visits</Text>
        </View>
        <View style={styles.headerActions}>
          {onOpenManual ? (
            <TouchableOpacity style={styles.manualButton} onPress={onOpenManual}>
              <Text style={styles.manualText}>Manual Visit</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={styles.logoutButton} onPress={clearSession}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dayCard}>
        <View>
          <Text style={styles.dayLabel}>Attendance</Text>
          <Text style={styles.dayStatus}>{status === 'STARTED' ? 'On Duty' : status === 'ENDED' ? 'Ended' : 'Not Started'}</Text>
        </View>
        {status === 'STARTED' ? (
          <TouchableOpacity style={styles.endButton} onPress={handleEndDay}>
            <Text style={styles.endText}>End Day</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.startButton} onPress={handleStartDay}>
            <Text style={styles.startText}>Start Day</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Visits</Text>
          <Text style={styles.statValue}>{stats.visitsPlanned || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Follow-ups</Text>
          <Text style={styles.statValue}>{stats.pendingFollowUps || 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Orders</Text>
          <Text style={styles.statValue}>{stats.ordersBooked || 0}</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Beat Plan</Text>
        <Text style={styles.sectionHint}>{beats.length} stops</Text>
      </View>

      <FlatList
        data={beats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.beatCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.beatName}>{item.name}</Text>
              <Text style={styles.beatMeta}>{item.city} • {item.address}</Text>
              {item.note ? <Text style={styles.beatNote}>{item.note}</Text> : null}
            </View>
            <TouchableOpacity style={styles.visitButton} onPress={() => handleStartVisit(item)}>
              <Text style={styles.visitText}>Start Visit</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: salesmanColors.bg, padding: salesmanSpacing.lg },
  header: { marginBottom: salesmanSpacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  manualButton: {
    backgroundColor: salesmanColors.card,
    borderWidth: 1,
    borderColor: salesmanColors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  manualText: { color: salesmanColors.primary, fontWeight: '700', fontSize: 12 },
  title: { fontSize: 20, fontWeight: '800', color: salesmanColors.text },
  subtitle: { color: salesmanColors.muted, marginTop: 4 },
  logoutButton: {
    backgroundColor: salesmanColors.card,
    borderWidth: 1,
    borderColor: salesmanColors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: { color: salesmanColors.text, fontWeight: '700', fontSize: 12 },
  dayCard: {
    backgroundColor: salesmanColors.card,
    borderRadius: 16,
    padding: salesmanSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: salesmanColors.border,
  },
  dayLabel: { color: salesmanColors.muted, fontSize: 12 },
  dayStatus: { fontSize: 16, fontWeight: '700', color: salesmanColors.text, marginTop: 4 },
  startButton: { backgroundColor: salesmanColors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  startText: { color: '#FFFFFF', fontWeight: '700' },
  endButton: { backgroundColor: salesmanColors.warning, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  endText: { color: '#1A1A1A', fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: salesmanSpacing.md },
  statCard: {
    flex: 1,
    backgroundColor: salesmanColors.card,
    borderRadius: 14,
    padding: salesmanSpacing.md,
    borderWidth: 1,
    borderColor: salesmanColors.border,
  },
  statLabel: { color: salesmanColors.muted, fontSize: 11 },
  statValue: { color: salesmanColors.text, fontWeight: '800', fontSize: 18, marginTop: 6 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: salesmanSpacing.lg, marginBottom: salesmanSpacing.sm },
  sectionTitle: { fontWeight: '700', color: salesmanColors.text },
  sectionHint: { color: salesmanColors.muted },
  list: { paddingBottom: 80 },
  beatCard: {
    backgroundColor: salesmanColors.card,
    borderRadius: 14,
    padding: salesmanSpacing.md,
    borderWidth: 1,
    borderColor: salesmanColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: salesmanSpacing.sm,
  },
  beatName: { color: salesmanColors.text, fontWeight: '700' },
  beatMeta: { color: salesmanColors.muted, fontSize: 12, marginTop: 4 },
  beatNote: { color: salesmanColors.muted, fontSize: 11, marginTop: 4 },
  visitButton: { backgroundColor: salesmanColors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: salesmanColors.border },
  visitText: { color: salesmanColors.primary, fontWeight: '700', fontSize: 11 },
});
