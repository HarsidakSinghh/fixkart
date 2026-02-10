import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { vendorColors, vendorSpacing } from './VendorTheme';
import { getSalesmanTrack } from './vendorApi';

export default function VendorSalesmanTrackScreen({ salesman, onBack }) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [track, setTrack] = useState([]);
  const [current, setCurrent] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadTrack = useCallback(async () => {
    if (!salesman?.id) return;
    setLoading(true);
    try {
      const data = await getSalesmanTrack(salesman.id);
      setActive(!!data.active);
      setTrack(Array.isArray(data.track) ? data.track : []);
      setCurrent(data.current || null);
      setLastUpdated(data.lastUpdated || null);
    } catch (error) {
      setTrack([]);
      setCurrent(null);
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }, [salesman?.id]);

  useEffect(() => {
    loadTrack();
  }, [loadTrack]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadTrack();
    }, active ? 10000 : 30000);
    return () => clearInterval(interval);
  }, [active, loadTrack]);

  const mapPoints = useMemo(
    () =>
      track
        .filter((point) => typeof point.lat === 'number' && typeof point.lng === 'number')
        .map((point) => ({ latitude: point.lat, longitude: point.lng })),
    [track]
  );

  const focus = useMemo(() => {
    if (current?.lat && current?.lng) {
      return { latitude: current.lat, longitude: current.lng };
    }
    if (mapPoints.length) {
      return mapPoints[mapPoints.length - 1];
    }
    return null;
  }, [current, mapPoints]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{salesman?.name || 'Salesman'}</Text>
          <Text style={styles.subtitle}>{active ? 'Live tracking' : 'Last day track'}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{active ? 'Active' : 'Inactive'}</Text>
        {lastUpdated ? (
          <Text style={styles.statusMeta}>Last updated: {new Date(lastUpdated).toLocaleString()}</Text>
        ) : null}
      </View>

      <View style={styles.mapCard}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={vendorColors.primary} />
            <Text style={styles.loadingText}>Loading location…</Text>
          </View>
        ) : focus ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: focus.latitude,
              longitude: focus.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {mapPoints.length > 1 ? (
              <Polyline coordinates={mapPoints} strokeWidth={4} strokeColor={vendorColors.primary} />
            ) : null}
            {active && current?.lat && current?.lng ? (
              <Marker
                coordinate={{ latitude: current.lat, longitude: current.lng }}
                title="Live location"
              />
            ) : null}
            {!active && mapPoints.length ? (
              <Marker coordinate={mapPoints[0]} title="Start" />
            ) : null}
            {!active && mapPoints.length ? (
              <Marker coordinate={mapPoints[mapPoints.length - 1]} title="End" />
            ) : null}
          </MapView>
        ) : (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>No GPS data yet.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: vendorColors.bg, padding: vendorSpacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: vendorSpacing.md },
  backText: { color: vendorColors.primary, fontWeight: '700' },
  title: { color: vendorColors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: vendorColors.muted, fontSize: 12, marginTop: 4 },
  statusRow: {
    backgroundColor: vendorColors.card,
    borderRadius: 14,
    padding: vendorSpacing.md,
    borderWidth: 1,
    borderColor: vendorColors.border,
  },
  statusText: { color: vendorColors.text, fontWeight: '700' },
  statusMeta: { color: vendorColors.muted, fontSize: 12, marginTop: 4 },
  mapCard: {
    marginTop: vendorSpacing.lg,
    flex: 1,
    backgroundColor: vendorColors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: vendorColors.border,
    overflow: 'hidden',
  },
  map: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: vendorColors.muted, marginTop: 8 },
});
