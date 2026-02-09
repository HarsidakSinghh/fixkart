import React from "react";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import Image from "next/image"; // <--- Added Import
import { ChevronLeft, MessageSquare, CheckCircle, Clock } from "lucide-react";

// --- SERVER ACTION FOR FORM SUBMISSION ---
async function requestClosureAction(formData: FormData) {
  "use server";
  const complaintId = formData.get("complaintId") as string;
  const solution = formData.get("solution") as string;
  
  if (!complaintId || !solution) return;

  await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      vendorSolution: solution,
      closureRequestedAt: new Date(),
      status: "CLOSURE_REQUESTED"
    }
  });

  revalidatePath(`/vendor/complaints/${complaintId}`);
}

// --- PAGE COMPONENT ---
export default async function ComplaintDetailPage({ 
  params 
}: { 
  params: Promise<{ complaintId: string }> 
}) {
  const { complaintId } = await params;
  
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Fetch Data
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      order: { include: { items: true } }
    }
  });

  // Security Check
  if (!complaint || complaint.vendorId !== user.id) {
    notFound();
  }

  const isClosed = complaint.status === "RESOLVED" || complaint.status === "CLOSED";
  const isRequested = complaint.status === "CLOSURE_REQUESTED";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-3xl">
        
        {/* Back Button */}
        <Link href="/vendor/complaints" className="flex items-center text-gray-500 hover:text-gray-900 mb-6 w-fit">
          <ChevronLeft size={18} /> <span className="ml-1 text-sm font-medium">Back to Complaints</span>
        </Link>

        {/* --- MAIN CARD --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Complaint #{complaint.id.slice(-6).toUpperCase()}</h1>
              <p className="text-sm text-gray-500 mt-1">Created on {new Date(complaint.createdAt).toLocaleDateString()}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isClosed ? "bg-green-100 text-green-700 border-green-200" :
                isRequested ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                "bg-red-100 text-red-700 border-red-200"
            }`}>
              {complaint.status.replace("_", " ")}
            </div>
          </div>

          <div className="p-6 space-y-8">
            
            {/* 1. Customer Issue Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <MessageSquare size={16} /> Customer Issue
              </h3>
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-gray-800 font-medium text-lg">"{complaint.message}"</p>
                
                {/* --- DISPLAY PROOF IMAGES --- */}
                {complaint.proofImages && complaint.proofImages.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-red-200">
                        <p className="text-xs font-bold text-red-400 uppercase mb-2">Attached Proof:</p>
                        <div className="flex flex-wrap gap-3">
                            {complaint.proofImages.map((img, idx) => (
                                <a 
                                    key={idx} 
                                    href={img} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="relative w-24 h-24 block border border-red-200 rounded-lg overflow-hidden bg-white hover:opacity-90 hover:shadow-md transition"
                                >
                                    <Image 
                                        src={img} 
                                        alt={`Proof ${idx + 1}`} 
                                        fill 
                                        className="object-cover" 
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-3 flex gap-4 text-sm text-gray-500 border-t border-red-200 pt-3">
                   <span>Order: <strong>#{complaint.orderId.slice(-6)}</strong></span>
                   <span>Customer: <strong>{complaint.order.customerName}</strong></span>
                </div>
              </div>
            </div>

            {/* 2. Vendor Solution Section */}
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle size={16} /> Resolution Logic
              </h3>
              
              {/* STATE A: Already Closed */}
              {isClosed && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-green-800">
                  <p className="font-medium">This complaint has been officially resolved.</p>
                  <p className="text-sm mt-1 opacity-80">Solution: {complaint.vendorSolution || "Resolved by Admin"}</p>
                </div>
              )}

              {/* STATE B: Waiting for Admin */}
              {isRequested && (
                <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200 text-center">
                  <Clock className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                  <h4 className="font-bold text-yellow-800">Request Sent to Admin</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    You submitted a solution on <strong>{complaint.closureRequestedAt?.toLocaleString()}</strong>.
                  </p>
                  <p className="text-sm text-yellow-600 mt-2 bg-white/50 p-2 rounded inline-block">
                    "{complaint.vendorSolution}"
                  </p>
                  <p className="text-xs text-yellow-600 mt-4">Please wait for Super Admin approval.</p>
                </div>
              )}

              {/* STATE C: Open (Form to Request Close) */}
              {!isClosed && !isRequested && (
                <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                  <form action={requestClosureAction} className="space-y-4">
                    <input type="hidden" name="complaintId" value={complaint.id} />
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Solution Description <span className="text-red-500">*</span>
                      </label>
                      <textarea 
                        name="solution"
                        required
                        rows={4}
                        placeholder="Describe how you solved this issue (e.g., Refund initiated, Replacement sent)..."
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      ></textarea>
                    </div>

                    <div className="bg-blue-50 p-3 rounded text-xs text-blue-700 mb-4">
                      <strong>Note:</strong> Submitting this will not close the ticket immediately. 
                      It sends a request to the Super Admin with your solution and timestamp.
                    </div>

                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        className="bg-[#00529b] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Submit & Request Closure
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}