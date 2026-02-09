"use client";

import { useState } from "react";
import { startDuty } from "@/app/actions/salesman-duty";
import { Loader2, Power } from "lucide-react";

export default function StartDutyButton() {
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    setLoading(true);

    if (!("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    // 1. Get High Accuracy GPS
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // 2. Send to Server
        const res = await startDuty(latitude, longitude);
        
        if (!res.success) {
          alert("Failed to start duty. Please try again.");
          setLoading(false);
        } else {
           // Page will auto-refresh via server action revalidatePath
           // We keep loading true until that happens for smooth UX
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        alert("⚠️ Location Access Denied.\n\nPlease enable Location Services for this website to start your duty.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="group relative w-full max-w-xs bg-[#00529b] hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-xl shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
    >
      <div className="relative z-10 flex items-center justify-center gap-3">
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            <span>Locating you...</span>
          </>
        ) : (
          <>
            <Power className="group-hover:scale-110 transition-transform" />
            <span>START DUTY</span>
          </>
        )}
      </div>
      
      {/* Shiny Effect */}
      {!loading && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />}
    </button>
  );
}