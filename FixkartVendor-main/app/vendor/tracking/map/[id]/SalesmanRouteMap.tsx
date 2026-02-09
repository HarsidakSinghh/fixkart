"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { Store, Flag, Navigation } from "lucide-react";

// --- FIX LEAFLET DEFAULT ICONS IN NEXT.JS ---
const iconBase = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/";
const DefaultIcon = L.icon({
  iconUrl: iconBase + "marker-icon.png",
  shadowUrl: iconBase + "marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- CUSTOM ICONS ---
// We use simple colored markers for different events
const startIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div style="background-color: green; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
});

const endIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div style="background-color: red; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
});

const shopIcon = L.divIcon({
  className: "bg-transparent",
  html: `<div style="background-color: #00529b; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display:flex; align-items:center; justify-content:center; color:white; font-size:10px;">🏢</div>`,
});


interface MapProps {
  logs: { lat: number; lng: number; timestamp: Date }[];
  checkpoints: {
    id: string;
    type: string;
    lat: number;
    lng: number;
    shopName?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
    createdAt: Date
  }[];
}

export default function SalesmanRouteMap({ logs, checkpoints }: MapProps) {

  // 1. Calculate Center
  // If we have logs, center on the last one. If not, default to India center.
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const centerPosition: [number, number] = lastLog
    ? [lastLog.lat, lastLog.lng]
    : [20.5937, 78.9629];

  // 2. Format Path for Polyline
  const pathPositions: [number, number][] = logs.map(l => [l.lat, l.lng]);

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 z-0 relative">
      <MapContainer
        center={centerPosition}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        {/* OpenStreetMap Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* --- 1. THE BLUE LINE (PATH) --- */}
        {pathPositions.length > 1 && (
          <Polyline
            positions={pathPositions}
            pathOptions={{ color: 'blue', weight: 4, opacity: 0.6, dashArray: '10, 10' }}
          />
        )}

        {/* --- 2. THE CHECKPOINTS (PINS) --- */}
        {checkpoints.map((cp) => {
          let icon: L.Icon | L.DivIcon = DefaultIcon;
          let title = "Event";

          if (cp.type === "START_DUTY") { icon = startIcon; title = "Started Duty"; }
          if (cp.type === "END_DUTY") { icon = endIcon; title = "Ended Duty"; }
          if (cp.type === "SHOP_VISIT") { icon = shopIcon; title = cp.shopName || "Shop Visit"; }

          return (
            <Marker key={cp.id} position={[cp.lat, cp.lng]} icon={icon}>
              <Popup className="custom-popup">
                <div className="p-1 min-w-[200px]">
                  <h4 className="font-bold text-gray-800 mb-1">{title}</h4>
                  <p className="text-xs text-gray-500 mb-2">
                    {new Date(cp.createdAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: '2-digit', minute: '2-digit' })}
                  </p>

                  {cp.notes && (
                    <p className="text-sm bg-gray-50 p-2 rounded mb-2 border">"{cp.notes}"</p>
                  )}

                  {cp.imageUrl && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                      <img src={cp.imageUrl} alt="Proof" className="object-cover w-full h-full" />
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* --- 3. CURRENT LOCATION MARKER --- */}
        {logs.length > 0 && (
          <Marker position={[logs[logs.length - 1].lat, logs[logs.length - 1].lng]}>
            <Popup>Current Last Known Location</Popup>
          </Marker>
        )}

      </MapContainer>
    </div>
  );
}