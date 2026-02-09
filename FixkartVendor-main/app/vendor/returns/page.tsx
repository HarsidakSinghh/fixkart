import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { RefreshCw, CheckCircle, XCircle, Clock, ImageIcon, AlertTriangle } from "lucide-react";
import ReturnActionButtons from "./ReturnActionButtons";
import DisputeChatModal from "./DisputeChatModal"; // <--- Import the Chat Modal

export const dynamic = "force-dynamic";

export default async function VendorReturnsPage() {
  const { userId } = await auth();
  if (!userId) return <div>Unauthorized</div>;

  // Fetch Refunds for this Vendor
  const refunds = await prisma.refundRequest.findMany({
    where: { vendorId: userId },
    include: {
      item: {
        include: {
           product: true,
           order: true // To get Customer Name
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <RefreshCw className="text-[#00529b]" /> Returns & Refunds
           </h1>
           <p className="text-sm text-gray-500">Manage customer return requests</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {refunds.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
                <RefreshCw size={48} className="mx-auto mb-4 opacity-20" />
                <p>No return requests found.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                    <th className="p-4 text-sm font-bold text-gray-600">Product</th>
                    <th className="p-4 text-sm font-bold text-gray-600">Customer</th>
                    <th className="p-4 text-sm font-bold text-gray-600">Reason</th>
                    <th className="p-4 text-sm font-bold text-gray-600">Proof</th>
                    <th className="p-4 text-sm font-bold text-gray-600">Date</th>
                    <th className="p-4 text-sm font-bold text-gray-600">Status</th>
                    <th className="p-4 text-sm font-bold text-gray-600 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {refunds.map((req) => (
                    <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 group transition-colors">
                        {/* Product */}
                        <td className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="relative w-10 h-10 bg-gray-100 rounded border overflow-hidden">
                                    <Image 
                                        src={req.item?.product.image || "/placeholder.png"} 
                                        fill 
                                        alt="img" 
                                        className="object-contain"
                                    />
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-800 line-clamp-1">{req.item?.product.name || "Unknown Item"}</p>
                                    <p className="text-xs text-gray-400">Qty: {req.item?.quantity || 1}</p>
                                </div>
                            </div>
                        </td>

                        {/* Customer */}
                        <td className="p-4">
                            <p className="text-sm font-medium text-gray-700">{req.item?.order.customerName || "Guest"}</p>
                            <p className="text-xs text-gray-400">ID: {req.item?.order.customerId.slice(-6)}</p>
                        </td>

                        {/* Reason */}
                        <td className="p-4">
                            <div className="max-w-[150px] text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-2">
                                "{req.reason}"
                            </div>
                        </td>

                        {/* Proof Image (Customer's Proof) */}
                        <td className="p-4">
                            {req.proofImages && req.proofImages.length > 0 ? (
                                <div className="flex gap-2">
                                    {req.proofImages.map((img, idx) => (
                                        <a 
                                            key={idx} 
                                            href={img} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="relative w-12 h-12 block border border-gray-200 rounded-lg overflow-hidden hover:opacity-80 hover:ring-2 ring-blue-500 transition-all"
                                            title="Click to view full image"
                                        >
                                            <Image 
                                                src={img} 
                                                alt="Proof" 
                                                fill 
                                                className="object-cover" 
                                            />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-gray-400 italic flex items-center gap-1">
                                    <ImageIcon size={12}/> No Image
                                </span>
                            )}
                        </td>

                        {/* Date */}
                        <td className="p-4 text-sm text-gray-500">
                            {new Date(req.createdAt).toLocaleDateString()}
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit ${
                                req.status === "APPROVED" ? "bg-green-100 text-green-700" :
                                req.status === "REJECTED" ? "bg-red-100 text-red-700" :
                                req.status === "DISPUTED" ? "bg-purple-100 text-purple-700" :
                                "bg-yellow-100 text-yellow-700"
                            }`}>
                                {req.status === "APPROVED" && <CheckCircle size={12} />}
                                {req.status === "REJECTED" && <XCircle size={12} />}
                                {req.status === "DISPUTED" && <AlertTriangle size={12} />}
                                {req.status === "PENDING" && <Clock size={12} />}
                                {req.status}
                            </span>
                        </td>

                        {/* Actions: Approve/Reject OR Chat */}
                        <td className="p-4 text-right">
                            {req.status === "PENDING" ? (
                                <ReturnActionButtons requestId={req.id} />
                            ) : (
                                /* --- SHOW CHAT BUTTON FOR DISPUTED/REJECTED ITEMS --- */
                                (req.status === "DISPUTED" || req.status === "REJECTED") && (
                                    <div className="flex justify-end">
                                        <DisputeChatModal request={req} />
                                    </div>
                                )
                            )}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        )}
      </div>
    </div>
  );
}