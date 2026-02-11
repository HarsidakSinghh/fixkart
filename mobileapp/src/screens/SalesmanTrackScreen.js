import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { WebView } from "react-native-webview";
import { colors, spacing } from "../theme";
import { getSalesmanTrack } from "../services/salesmanAdminApi";

export default function SalesmanTrackScreen({ salesman, onBack }) {
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);
  const [track, setTrack] = useState([]);
  const [current, setCurrent] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [startAt, setStartAt] = useState(null);
  const [endAt, setEndAt] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);

  const loadTrack = useCallback(async () => {
    if (!salesman?.id) return;
    setLoading(true);
    try {
      const data = await getSalesmanTrack(salesman.id);
      setActive(!!data.active);
      setTrack(Array.isArray(data.track) ? data.track : []);
      setCurrent(data.current || null);
      setLastUpdated(data.lastUpdated || null);
      setStartAt(data.startAt || null);
      setEndAt(data.endAt || null);
      setRecentVisits(Array.isArray(data.recentVisits) ? data.recentVisits : []);
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
        .filter((point) => typeof point.lat === "number" && typeof point.lng === "number")
        .map((point) => [point.lat, point.lng]),
    [track]
  );

  const focus = useMemo(() => {
    if (current?.lat && current?.lng) {
      return [current.lat, current.lng];
    }
    if (mapPoints.length) {
      return mapPoints[mapPoints.length - 1];
    }
    return null;
  }, [current, mapPoints]);

  const mapHtml = useMemo(() => {
    const points = JSON.stringify(mapPoints);
    const focusPoint = JSON.stringify(focus);
    const live = JSON.stringify(current && current.lat && current.lng ? [current.lat, current.lng] : null);
    const showStart = JSON.stringify(!active && mapPoints.length ? mapPoints[0] : null);
    const showEnd = JSON.stringify(!active && mapPoints.length ? mapPoints[mapPoints.length - 1] : null);

    return `<!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            html, body, #map { height: 100%; margin: 0; padding: 0; }
            .leaflet-control-attribution { font-size: 10px; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const points = ${points};
            const focus = ${focusPoint};
            const live = ${live};
            const start = ${showStart};
            const end = ${showEnd};
            const map = L.map('map', { zoomControl: true });
            if (focus) {
              map.setView(focus, 13);
            } else {
              map.setView([20.5937, 78.9629], 4);
            }
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; OpenStreetMap contributors',
            }).addTo(map);
            if (points.length > 1) {
              L.polyline(points, { color: '#2563EB', weight: 4 }).addTo(map);
            }
            if (live) {
              L.marker(live).addTo(map).bindPopup('Live location');
            }
            if (start) {
              L.marker(start).addTo(map).bindPopup('Start');
            }
            if (end) {
              L.marker(end).addTo(map).bindPopup('End');
            }
          </script>
        </body>
      </html>`;
  }, [mapPoints, focus, current, active]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerPad}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>{salesman?.name || "Salesman"}</Text>
          <Text style={styles.subtitle}>{active ? "Live tracking" : "Last day track"}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{active ? "Active" : "Inactive"}</Text>
        {lastUpdated ? (
          <Text style={styles.statusMeta}>Last updated: {new Date(lastUpdated).toLocaleString()}</Text>
        ) : null}
        {startAt ? (
          <Text style={styles.statusMeta}>Start: {new Date(startAt).toLocaleTimeString()}</Text>
        ) : null}
        {active ? null : endAt ? (
          <Text style={styles.statusMeta}>End: {new Date(endAt).toLocaleTimeString()}</Text>
        ) : null}
      </View>

      <View style={styles.mapCard}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading location…</Text>
          </View>
        ) : focus ? (
          <WebView style={styles.map} originWhitelist={["*"]} source={{ html: mapHtml }} javaScriptEnabled domStorageEnabled />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.loadingText}>No GPS data yet.</Text>
          </View>
        )}
      </View>

      <View style={styles.recentCard}>
        <Text style={styles.recentTitle}>Recent 3 Visits</Text>
        {recentVisits.length ? (
          recentVisits.map((visit) => (
            <View key={visit.id} style={styles.recentRow}>
              <Text style={styles.recentName}>{visit.companyName || "Visit"}</Text>
              {visit.companyAddress ? <Text style={styles.recentMeta}>{visit.companyAddress}</Text> : null}
              {visit.note ? <Text style={styles.recentMeta}>{visit.note}</Text> : null}
              <Text style={styles.recentMeta}>{new Date(visit.createdAt).toLocaleString()}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.recentMeta}>No recent visits logged yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  containerPad: { padding: spacing.lg, paddingBottom: 140 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.md },
  backText: { color: colors.primary, fontWeight: "700" },
  title: { color: colors.text, fontSize: 18, fontWeight: "800" },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  statusRow: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statusText: { color: colors.text, fontWeight: "700" },
  statusMeta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  mapCard: {
    marginTop: spacing.lg,
    height: 360,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  map: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: colors.muted, marginTop: 8 },
  recentCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  recentTitle: { color: colors.text, fontWeight: "700", marginBottom: spacing.sm },
  recentRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  recentName: { color: colors.text, fontWeight: "700" },
  recentMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
});
