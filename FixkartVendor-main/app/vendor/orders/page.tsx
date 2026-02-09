import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import OrderActionButtons from "./OrderActionButtons";
import DeliveryInput from "./DeliveryInput";
import OrderDocUpload from "@/components/OrderDocUpload"; 
// 1. ADDED IMPORTS FOR ICONS
import { FileText, Loader, Download } from "lucide-react"; 

export const dynamic = "force-dynamic";

export default async function VendorOrdersPage() {
  const { userId } = await auth();
  if (!userId) return <div className="p-8 text-red-500">Unauthorized</div>;

  const orderItems = await prisma.orderItem.findMany({
    where: { vendorId: userId },
    include: {
      product: true,
      // 2. FETCH CLOUDINARY URLs (This part was already correct in your code)
      order: {
          select: {
              id: true,
              customerPoUrl: true, 
              invoiceUrl: true,    
              createdAt: true
          }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
          {orderItems.length} Items Sold
        </span>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 text-sm font-bold text-gray-600">Order ID</th>
              <th className="p-4 text-sm font-bold text-gray-600">Item Details</th>
              <th className="p-4 text-sm font-bold text-gray-600">Qty</th>
              <th className="p-4 text-sm font-bold text-gray-600">Earnings</th>
              <th className="p-4 text-sm font-bold text-gray-600">Status</th>
              <th className="p-4 text-sm font-bold text-gray-600">Est. Delivery</th>
              <th className="p-4 text-sm font-bold text-gray-600">Documents</th> 
              <th className="p-4 text-sm font-bold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.length === 0 ? (
               <tr><td colSpan={8} className="p-12 text-center text-gray-500">No new orders found.</td></tr>
            ) : (
              orderItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  
                  {/* Order ID */}
                  <td className="p-4 text-sm text-gray-600 font-medium">
                    #{item.order.id.slice(-6).toUpperCase()}
                  </td>

                  {/* Product Info */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded bg-gray-100 overflow-hidden border border-gray-200">
                          <Image 
                            src={item.product.image || "https://placehold.co/100"} 
                            fill 
                            alt="img" 
                            className="object-contain p-1"
                          />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-gray-400">ID: {item.id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  
                  <td className="p-4 text-gray-700 font-medium">{item.quantity}</td>
                  <td className="p-4 font-bold text-[#00529b]">₹{(item.price * item.quantity).toLocaleString()}</td>

                  {/* Status */}
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                      item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      item.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                      item.status === 'SHIPPED' ? 'bg-purple-100 text-purple-700' :
                      item.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>

                  {/* Delivery Input */}
                  <td className="p-4">
                    <DeliveryInput 
                      itemId={item.id} 
                      current={item.deliveryDate} 
                    />
                  </td>

                  {/* --- DOCUMENTS SECTION (Merged Uploads & Downloads) --- */}
                  <td className="p-4">
                    <div className="flex flex-col gap-3">
                      {/* A. Uploads for Vendor (Bill/Slip) */}
                      <div className="flex gap-2">
                          <OrderDocUpload 
                            itemId={item.id} 
                            docType="bill" 
                            currentUrl={item.billUrl} 
                          />
                          <OrderDocUpload 
                            itemId={item.id} 
                            docType="slip" 
                            currentUrl={item.transportSlipUrl} 
                          />
                      </div>

                      {/* B. Downloads for Vendor (PO & PI) */}
                      <div className="flex gap-2 mt-1 pt-2 border-t border-gray-100">
                          {/* 1. PURCHASE ORDER (PO) */}
                          {item.order.customerPoUrl ? (
                              <a 
                                href={item.order.customerPoUrl} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition text-[10px] font-bold"
                                title="Download Customer PO"
                              >
                                <FileText size={10} /> PO
                              </a>
                          ) : (
                              <span className="flex-1 text-[10px] text-gray-400 italic flex items-center justify-center gap-1 cursor-default border border-gray-100 rounded bg-gray-50">
                                <Loader size={10} className="animate-spin"/> PO...
                              </span>
                          )}

                          {/* 2. PURCHASE INVOICE (PI) */}
                          {item.order.invoiceUrl ? (
                              <a 
                                href={item.order.invoiceUrl} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition text-[10px] font-bold"
                                title="Download Tax Invoice"
                              >
                                <FileText size={10} /> PI
                              </a>
                          ) : (
                              <span className="flex-1 text-[10px] text-gray-300 italic flex items-center justify-center border border-gray-100 rounded bg-gray-50">
                                Pending
                              </span>
                          )}
                      </div>
                    </div>
                  </td>

                  <td className="p-4 text-right">
                    <OrderActionButtons itemId={item.id} currentStatus={item.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}