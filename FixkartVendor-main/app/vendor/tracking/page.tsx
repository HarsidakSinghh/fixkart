import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AddSalesmanModal from "./AddSalesmanModal";
import { Map, Phone, User, Clock, ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VendorTrackingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // 1. Fetch My Salesmen
  const salesmen = await prisma.salesman.findMany({
    where: { vendorId: userId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Field Force Tracking</h1>
            <p className="text-gray-500 text-sm">Monitor your team's real-time location and visits.</p>
          </div>
          <AddSalesmanModal />
        </div>

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {salesmen.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-300">
               <User size={48} className="mx-auto mb-4 opacity-20" />
               <p>No salesmen added yet.</p>
               <p className="text-sm">Click "Add Salesman" to get started.</p>
            </div>
          ) : (
            salesmen.map((person) => {
              // 2. Logic: Consider "Online" if updated in last 5 mins
              const lastActive = person.lastUpdated ? new Date(person.lastUpdated).getTime() : 0;
              const now = new Date().getTime();
              const isOnline = (now - lastActive) < 5 * 60 * 1000; // 5 Minutes
              
              return (
                <div key={person.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="p-4 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white ${isOnline ? "bg-green-500" : "bg-gray-400"}`}>
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{person.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-300"}`}></span>
                          {isOnline ? "Online Now" : "Offline"}
                        </p>
                      </div>
                    </div>
                    {/* Access Code Badge */}
                    <div className="bg-gray-100 px-2 py-1 rounded text-xs font-mono font-bold text-gray-600" title="Access Code">
                      {person.code}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} /> {person.phone}
                    </div>
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Clock size={14} /> 
                      Last Update: {person.lastUpdated ? new Date(person.lastUpdated).toLocaleTimeString() : "Never"}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="bg-gray-50 p-3 flex gap-2">
                    {person.lastUpdated ? (
                      <Link 
                        href={`/vendor/tracking/map/${person.id}`} // We build this tomorrow (Day 7)
                        className="flex-1 bg-white border border-blue-200 text-blue-700 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition"
                      >
                        <Map size={16} /> View Map
                      </Link>
                    ) : (
                      <div className="flex-1 text-center text-xs text-gray-400 py-2 flex items-center justify-center gap-1">
                        <ShieldAlert size={14} /> No Location Data
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}