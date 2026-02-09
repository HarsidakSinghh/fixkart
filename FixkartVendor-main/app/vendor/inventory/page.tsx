import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { Edit, Eye, ExternalLink } from "lucide-react";

export default async function VendorInventoryPage() {
  const { userId } = await auth();
  if (!userId) return <div>Unauthorized</div>;

  const products = await prisma.product.findMany({
    where: { vendorId: userId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Inventory</h1>
        <span className="text-gray-500 text-sm font-medium">
          Total Items: {products.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
            
            {/* --- 1. PREVIEW LINK (Clicking Image goes to Product Page) --- */}
            <Link href={`/product/${product.slug}`} target="_blank" className="block relative h-48 bg-gray-50 border-b border-gray-100 cursor-pointer">
               <Image 
                 src={product.image || "https://placehold.co/400"} 
                 fill 
                 alt={product.name} 
                 className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
               />
               
               {/* Status Badge */}
               <div className="absolute top-2 right-2 z-10">
                 <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full ${
                   product.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                 }`}>
                   {product.status}
                 </span>
               </div>

               {/* Hover Overlay for Preview */}
               <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-gray-700 flex items-center gap-1 shadow-sm">
                    <ExternalLink size={12} /> Preview
                  </span>
               </div>
            </Link>
            
            <div className="p-4">
              {/* Product Info */}
              <Link href={`/product/${product.slug}`} target="_blank">
                <h3 className="font-bold text-gray-800 truncate hover:text-[#00529b] transition-colors" title={product.name}>
                  {product.name}
                </h3>
              </Link>
              <p className="text-xs text-gray-500 mb-4">{product.category} / {product.subCategory}</p>
              
              {/* --- 2. PRICE & EDIT SECTION --- */}
              <div className="flex items-end justify-between bg-gray-50 p-3 rounded-lg">
                <div>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Price</p>
                   <p className="font-bold text-[#00529b] text-lg">₹{product.price}</p>
                </div>
                
                {/* EDIT BUTTON */}
                <Link 
                  href={`/vendor/inventory/edit/${product.id}`}
                  className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 hover:bg-[#00529b] hover:text-white hover:border-[#00529b] transition-all shadow-sm"
                >
                  <Edit size={14} /> Edit
                </Link>
              </div>

              {/* Stock Footer */}
              <div className="mt-3 flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2">
                 <span>Stock Available:</span>
                 <span className={`font-bold ${product.quantity < 5 ? "text-red-500" : "text-gray-800"}`}>
                    {product.quantity} units
                 </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}