import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { salesmanColors, salesmanSpacing } from './SalesmanTheme';
import {
  getSalesmanDashboard,
  getSalesmanBeats,
  getSalesmanVisits,
  startDay,
  endDay,
  startVisit,
  deleteSalesmanVisit,
} from './salesmanApi';
import { useAuth } from '../context/AuthContext';
import { getCurrentCoords } from './location';
import { startBackgroundTracking, stopBackgroundTracking } from './backgroundLocation';

export default function SalesmanDashboardScreen({ onOpenVisit, onOpenManual }) {
  const [status, setStatus] = useState('NOT_STARTED');
  const [stats, setStats] = useState({});
  const [beats, setBeats] = useState([]);
  const [recentVisits, setRecentVisits] = useState([]);
  const [showBeats, setShowBeats] = useState(true);
  const [showVisits, setShowVisits] = useState(true);
  const { clearSession } = useAuth();

  const loadData = useCallback(async () => {
    const dashboard = await getSalesmanDashboard();
    setStatus(dashboard.status);
    setStats(dashboard.stats || {});
    const beatData = await getSalesmanBeats();
    setBeats(beatData.beats || []);
    const visitsData = await getSalesmanVisits();
    setRecentVisits(visitsData.visits || []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (status === 'STARTED') {
      startBackgroundTracking();
    } else {
      stopBackgroundTracking();
    }
  }, [status]);

  const handleStartDay = async () => {
    const coords = await getCurrentCoords();
    await startDay(coords?.lat ?? null, coords?.lng ?? null);
    await loadData();
    const result = await startBackgroundTracking();
    if (!result.ok && result.reason) {
      Alert.alert('Location permission needed', 'Enable background location for live tracking.');
    }
  };

  const handleEndDay = async () => {
    const coords = await getCurrentCoords();
    await endDay(coords?.lat ?? null, coords?.lng ?? null);
    await stopBackgroundTracking();
    await loadData();
  };

  const handleStartVisit = async (beat) => {
    await startVisit({ customerId: beat.id });
    onOpenVisit(beat);
  };

  const handleDeleteVisit = (visitId) => {
    Alert.alert('Delete visit', 'Remove this visit record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteSalesmanVisit(visitId);
          const visitsData = await getSalesmanVisits();
          setRecentVisits(visitsData.visits || []);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
          <Text style={styles.sectionTitle}>Assigned Visits</Text>
          <TouchableOpacity onPress={() => setShowBeats((prev) => !prev)}>
            <Text style={styles.sectionToggle}>{showBeats ? 'Collapse' : 'Expand'}</Text>
          </TouchableOpacity>
        </View>
        {showBeats ? (
          beats.length ? (
            beats.map((item) => (
              <View key={item.id} style={styles.beatCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.beatName}>{item.name}</Text>
                  <Text style={styles.beatMeta}>{item.city} • {item.address}</Text>
                  {item.visitDate ? <Text style={styles.beatNote}>Visit: {item.visitDate}</Text> : null}
                  {item.note ? <Text style={styles.beatNote}>{item.note}</Text> : null}
                </View>
                <TouchableOpacity style={styles.visitButton} onPress={() => handleStartVisit(item)}>
                  <Text style={styles.visitText}>Start Visit</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No assigned visits.</Text>
          )
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Previous Visits</Text>
          <TouchableOpacity onPress={() => setShowVisits((prev) => !prev)}>
            <Text style={styles.sectionToggle}>{showVisits ? 'Collapse' : 'Expand'}</Text>
          </TouchableOpacity>
        </View>
        {showVisits ? (
          recentVisits.length ? (
            recentVisits.map((visit) => (
              <View key={visit.id} style={styles.visitCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.beatName}>{visit.companyName || 'Visit'}</Text>
                  {visit.companyAddress ? (
                    <Text style={styles.beatMeta}>{visit.companyAddress}</Text>
                  ) : null}
                  {visit.note ? <Text style={styles.beatNote}>{visit.note}</Text> : null}
                </View>
                <View style={styles.visitRight}>
                  <Text style={styles.visitDate}>{new Date(visit.createdAt).toLocaleDateString()}</Text>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteVisit(visit.id)}>
                    <Text style={styles.deleteText}>X</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No visits logged yet.</Text>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: salesmanColors.bg },
  scroll: { padding: salesmanSpacing.lg, paddingBottom: 120 },
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
  sectionToggle: { color: salesmanColors.primary, fontWeight: '700', fontSize: 12 },
  visitCard: {
    backgroundColor: salesmanColors.card,
    borderRadius: 14,
    padding: salesmanSpacing.md,
    borderWidth: 1,
    borderColor: salesmanColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: salesmanSpacing.sm,
  },
  visitRight: { alignItems: 'flex-end', gap: 8 },
  visitDate: { color: salesmanColors.muted, fontSize: 11 },
  deleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FDECEC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F5C2C2',
  },
  deleteText: { color: '#C0392B', fontSize: 12, fontWeight: '800' },
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
  emptyText: { color: salesmanColors.muted, textAlign: 'center', marginBottom: salesmanSpacing.md },
});
