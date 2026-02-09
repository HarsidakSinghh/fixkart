"use client";

import { useState } from "react";
import { endDuty } from "@/app/actions/salesman-duty";
import { Power, Loader2 } from "lucide-react";

export default function EndDutyButton() {
  const [loading, setLoading] = useState(false);

  const handleEnd = () => {
    if (!confirm("Are you sure you want to end your duty for today?")) return;
    
    setLoading(true);

    if (!navigator.geolocation) {
       // If GPS fails, we force end anyway with 0,0 or handling error gracefully
       alert("GPS Error. Ending duty without location.");
       return; 
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await endDuty(latitude, longitude);
        // Page auto-refreshes
      },
      (err) => {
        console.error("GPS Error", err);
        alert("Could not get location. Please try again.");
        setLoading(false);
      }
    );
  };

  return (
    <button 
      onClick={handleEnd}
      disabled={loading}
      className="w-full bg-red-50 text-red-600 border border-red-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 mt-8 hover:bg-red-100 transition-colors"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} /> Signing Off...
        </>
      ) : (
        <>
          <Power size={20} /> END DUTY
        </>
      )}
    </button>
  );
}