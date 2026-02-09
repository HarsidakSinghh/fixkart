"use client";

import { useState } from "react";
import { updateOrderItemStatus } from "@/app/actions/vendor-dashboard";
import { Loader2, Check, Truck, X } from "lucide-react";

export default function OrderActionButtons({ itemId, currentStatus }: { itemId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status: string) => {
    if (!confirm(`Are you sure you want to mark this as ${status}?`)) return;
    setLoading(true);
    await updateOrderItemStatus(itemId, status);
    setLoading(false);
  };

  if (loading) return <Loader2 className="animate-spin text-gray-400 ml-auto" size={18} />;

  return (
    <div className="flex items-center justify-end gap-2">
      {currentStatus === "PENDING" && (
        <>
          <button onClick={() => handleUpdate("APPROVED")} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Approve">
            <Check size={18} />
          </button>
          <button onClick={() => handleUpdate("REJECTED")} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Reject">
            <X size={18} />
          </button>
        </>
      )}

      {currentStatus === "APPROVED" && (
        <button onClick={() => handleUpdate("SHIPPED")} className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-xs font-bold">
          <Truck size={14} /> Mark Shipped
        </button>
      )}

      {currentStatus === "SHIPPED" && (
        <span className="text-xs text-gray-400 italic">Waiting Delivery</span>
      )}
    </div>
  );
}