import { getSalesmanSession } from "@/app/actions/salesman-auth";
import { redirect } from "next/navigation";
import StartDutyButton from "./StartDutyButton"; 
import EndDutyButton from "./EndDutyButton"; // <--- Import Day 8 Button
import LocationTracker from "./LocationTracker"; 
import ShopVisitForm from "./ShopVisitForm"; 
import { MapPin, ShieldCheck, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SalesmanDashboard() {
  const salesman = await getSalesmanSession();
  if (!salesman) redirect("/salesman/login");

  const isOntDuty = salesman.status === "ACTIVE";

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* HEADER */}
      <div className="bg-[#00529b] text-white p-6 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Welcome back,</p>
          <h1 className="text-3xl font-bold">{salesman.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm opacity-90">
             <ShieldCheck size={16} />
             <span>ID: {salesman.code}</span>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="p-6 -mt-4">
        
        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between mb-6">
           <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Current Status</p>
              <div className={`flex items-center gap-2 mt-1 font-bold ${isOntDuty ? "text-green-600" : "text-gray-500"}`}>
                 <span className={`w-3 h-3 rounded-full ${isOntDuty ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></span>
                 {isOntDuty ? "ON DUTY (Tracking)" : "OFF DUTY"}
              </div>
           </div>
           {isOntDuty && <Clock className="text-green-500 opacity-20" size={32} />}
        </div>

        {/* --- ACTION AREA --- */}
        {!isOntDuty ? (
           <div className="flex flex-col items-center justify-center py-10 space-y-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                 <MapPin className="text-[#00529b]" size={32} />
              </div>
              <div className="text-center space-y-2 max-w-[250px]">
                 <h3 className="font-bold text-gray-800 text-lg">Ready to start?</h3>
                 <p className="text-sm text-gray-500 leading-relaxed">
                   Click below to mark your attendance and start location tracking.
                 </p>
              </div>
              <StartDutyButton />
           </div>
        ) : (
           <div className="space-y-6">
              {/* 1. AUTO TRACKER */}
              <LocationTracker />
              
              {/* 2. ACTIONS */}
              <div className="space-y-2">
                 <h3 className="text-sm font-bold text-gray-700 ml-1">Actions</h3>
                 <ShopVisitForm />
              </div>

              {/* 3. END DUTY BUTTON (Added Here) */}
              <EndDutyButton />
           </div>
        )}

      </div>
    </div>
  );
}