"use client";

import { useState, useActionState } from "react"; // [FIX] Import useActionState from 'react'
import { useFormStatus } from "react-dom"; 
import { approveRefund, rejectRefundWithProof } from "@/app/actions/vendor-refunds";
import { Check, X, Loader2, UploadCloud, AlertTriangle } from "lucide-react";

// --- SUBMIT BUTTON FOR MODAL ---
function ModalSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 transition disabled:opacity-70 flex justify-center items-center gap-2"
    >
      {pending ? <Loader2 className="animate-spin" size={16} /> : "Confirm Rejection & Escalate"}
    </button>
  );
}

// --- MAIN COMPONENT ---
export default function ReturnActionButtons({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // [FIX] Use useActionState instead of useFormState
  const [state, formAction] = useActionState(rejectRefundWithProof, { error: "" });

  // Handle Approve Immediately
  const handleApprove = async () => {
    if(!confirm("Are you sure you want to APPROVE this return?")) return;
    setLoading(true);
    await approveRefund(requestId);
    setLoading(false);
  };

  if (loading) return <Loader2 className="animate-spin text-gray-400" size={18} />;

  return (
    <>
      <div className="flex justify-end gap-2">
        <button 
          onClick={handleApprove}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded hover:bg-green-100 border border-green-200 transition-colors"
        >
          <Check size={14} /> Approve
        </button>
        <button 
          onClick={() => setShowRejectModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded hover:bg-red-100 border border-red-200 transition-colors"
        >
          <X size={14} /> Reject
        </button>
      </div>

      {/* --- REJECTION MODAL --- */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={18} /> Reject Return Request
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                To reject this return, you must provide a valid reason and proof. This will be escalated to the <strong>Super Admin</strong> for final review.
              </p>

              <form action={async (formData) => {
                  await formAction(formData);
                  setShowRejectModal(false); 
              }} className="space-y-4">
                <input type="hidden" name="requestId" value={requestId} />

                {/* Reason Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Reason for Rejection</label>
                  <textarea 
                    name="reason" 
                    required 
                    rows={3}
                    placeholder="E.g., Item returned is different from what was shipped..."
                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                  ></textarea>
                </div>

                {/* Proof Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Upload Proof (Images)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
                    <UploadCloud className="text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">Click to upload evidence</p>
                    <input 
                      type="file" 
                      name="proofImages" 
                      multiple 
                      accept="image/*" 
                      required 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                    />
                  </div>
                </div>

                {/* Error Message */}
                {state?.error && (
                  <p className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded">
                    ⚠️ {state.error}
                  </p>
                )}

                <ModalSubmitButton />
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 