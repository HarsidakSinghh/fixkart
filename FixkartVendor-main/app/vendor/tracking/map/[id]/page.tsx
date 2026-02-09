import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SalesmanRouteMap from "./SalesmanRouteMap";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SalesmanMapPage({ params }: { params: Promise<{ id: string }> }) {
   const { id } = await params;
   const { userId } = await auth();
   if (!userId) redirect("/sign-in");

   // 1. Fetch Salesman Info
   const salesman = await prisma.salesman.findUnique({
      where: { id: id },
   });

   if (!salesman || salesman.vendorId !== userId) {
      return <div>Salesman not found or unauthorized.</div>;
   }

   // 2. Fetch TODAY'S Tracking Logs (The Line)
   // Logic: Get start of today (00:00:00) to now
   const startOfDay = new Date();
   startOfDay.setHours(0, 0, 0, 0);

   const trackingLogs = await prisma.trackingLog.findMany({
      where: {
         salesmanId: id,
         timestamp: { gte: startOfDay }
      },
      orderBy: { timestamp: "asc" }
   });

   // 3. Fetch TODAY'S Checkpoints (The Pins)
   const checkpoints = await prisma.visitCheckpoint.findMany({
      where: {
         salesmanId: id,
         createdAt: { gte: startOfDay }
      },
      orderBy: { createdAt: "asc" }
   });

   return (
      <div className="min-h-screen bg-gray-50 p-6">
         <div className="max-w-6xl mx-auto">

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
               <div>
                  <Link href="/vendor/tracking" className="text-sm text-gray-500 hover:text-[#00529b] flex items-center gap-1 mb-2">
                     <ArrowLeft size={14} /> Back to Team List
                  </Link>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                     <User className="text-[#00529b]" /> {salesman.name}
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                     <Calendar size={14} /> View for Today: {new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
               </div>

               <div className="flex gap-4 text-sm">
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                     <span className="block text-xs text-gray-400 font-bold uppercase">Distance</span>
                     <span className="font-bold text-gray-800">
                        {/* Approx Calculation logic could go here */}
                        {trackingLogs.length > 0 ? "~" + (trackingLogs.length * 0.1).toFixed(1) + " km" : "0 km"}
                     </span>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                     <span className="block text-xs text-gray-400 font-bold uppercase">Visits</span>
                     <span className="font-bold text-green-600">{checkpoints.filter(c => c.type === "SHOP_VISIT").length} Shops</span>
                  </div>
               </div>
            </div>

            {/* MAP CONTAINER */}
            <SalesmanRouteMap logs={trackingLogs} checkpoints={checkpoints} />

            {/* CHECKPOINT LIST (Timeline) */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
               <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Today's Activity Log</h3>
               {checkpoints.length === 0 ? (
                  <p className="text-gray-400 text-sm">No activity recorded today.</p>
               ) : (
                  <div className="space-y-6">
                     {checkpoints.map((cp, index) => (
                        <div key={cp.id} className="flex gap-4 relative">
                           {/* Timeline Line */}
                           {index !== checkpoints.length - 1 && (
                              <div className="absolute left-[15px] top-8 bottom-[-24px] w-0.5 bg-gray-200"></div>
                           )}

                           {/* Icon */}
                           <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs z-10 ${cp.type === "START_DUTY" ? "bg-green-500" :
                                 cp.type === "END_DUTY" ? "bg-red-500" : "bg-[#00529b]"
                              }`}>
                              {cp.type === "SHOP_VISIT" ? "🏢" : "🚩"}
                           </div>

                           {/* Content */}
                           <div className="flex-1">
                              <div className="flex justify-between items-start">
                                 <h4 className="font-bold text-gray-800">
                                    {cp.type === "START_DUTY" ? "Started Duty" :
                                       cp.type === "END_DUTY" ? "Ended Duty" :
                                          cp.shopName}
                                 </h4>
                                 <span className="text-xs text-gray-400 font-mono">
                                    {new Date(cp.createdAt).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}
                                 </span>
                              </div>

                              {cp.notes && <p className="text-sm text-gray-600 mt-1">"{cp.notes}"</p>}

                              {cp.imageUrl && (
                                 <div className="mt-2">
                                    <a href={cp.imageUrl} target="_blank" className="text-xs text-blue-500 hover:underline">
                                       View Uploaded Proof
                                    </a>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

         </div>
      </div>
   );
}