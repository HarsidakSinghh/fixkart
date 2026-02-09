"use client";

import { useEffect, useState } from "react";
import { updateLocation } from "@/app/actions/salesman-tracking";
import { Loader2, Wifi, AlertTriangle } from "lucide-react";

export default function LocationTracker() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // 1. Define the sync function
    const syncLocation = () => {
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Send to Server
          const res = await updateLocation(latitude, longitude);
          
          if (res.success) {
            setLastUpdated(new Date());
            setError("");
            console.log("📍 Location synced:", latitude, longitude);
          }
        },
        (err) => {
          console.error("GPS Sync Error:", err);
          setError("GPS signal lost. Please move to open area.");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    // 2. Run immediately on mount
    syncLocation();

    // 3. Set Interval (Every 60 Seconds)
    const intervalId = setInterval(syncLocation, 60000); 

    // 4. Cleanup on unmount (End Duty)
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="bg-white border border-blue-100 rounded-xl p-4 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
         <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Live Tracking Active
         </div>
         <Wifi size={16} className="text-blue-500" />
      </div>

      {/* Info Text */}
      <p className="text-xs text-gray-500 leading-relaxed">
         Your location is being updated automatically every minute. 
         <span className="font-bold text-gray-700 block mt-1">
           ⚠️ Please keep this tab open.
         </span>
      </p>

      {/* Footer Status */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-400">
         {error ? (
           <span className="text-red-500 flex items-center gap-1">
             <AlertTriangle size={12} /> {error}
           </span>
         ) : (
           <span>Last Sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Syncing..."}</span>
         )}
         
         {!lastUpdated && <Loader2 size={12} className="animate-spin text-blue-500" />}
      </div>

    </div>
  );
}