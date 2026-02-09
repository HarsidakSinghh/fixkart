import React from "react";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import DeleteButton from "@/components/DeleteButton";
import CategoryPostButton from "@/components/CategoryPostButton"; 
import { auth } from "@clerk/nextjs/server"; 
import { INVENTORY_DATA } from "@/app/data/inventory"; 
import { Lock, CheckCircle, Eye, XCircle } from "lucide-react"; // Added XCircle

export const dynamic = "force-dynamic";

export default async function BrowseSubCategoryPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const { userId } = await auth();

  // If user is not logged in
  if (!userId) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Please sign in to view your inventory.</p>
        </div>
      );
  }

  // --- SMART SEARCH & FUZZY MATCHING ---
  let searchTerm = "";
  let displayTitle = "";
  let matchedSlug = slug;
  let matchedItemType: string | undefined = undefined; 

  const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");
  const targetSlug = normalize(slug);

  const mainCategory = INVENTORY_DATA.find(c => normalize(c.slug) === targetSlug);

  if (mainCategory) {
    searchTerm = mainCategory.title;
    displayTitle = mainCategory.title;
    matchedSlug = mainCategory.slug;
    matchedItemType = undefined; 
  } else {
    for (const cat of INVENTORY_DATA) {
      const itemMatch = cat.items.find(item => normalize(item.name) === targetSlug);
      
      if (itemMatch) {
        searchTerm = cat.title; 
        displayTitle = itemMatch.name; 
        matchedSlug = cat.slug;
        matchedItemType = itemMatch.name; 
        break;
      }
    }
  }

  if (!searchTerm) {
    searchTerm = slug.replace(/-/g, ' ');
    displayTitle = searchTerm;
  }

  // --- FETCH PRODUCTS (STRICTLY PRIVATE) ---
  const allProducts = await prisma.product.findMany({
    where: {
      subCategory: {
        contains: searchTerm, 
        mode: 'insensitive' 
      },
      // Strictly show ONLY this vendor's items
      vendorId: userId 
    },
    orderBy: { createdAt: 'desc' }
  });

  // --- FILTERING (Item Type) ---
  const filteredProducts = allProducts.filter(product => {
      if (!matchedItemType) return true; 
      return normalize(product.subSubCategory || "") === normalize(matchedItemType);
  });

  // --- GROUPING ---
  const groupedProducts: Record<string, typeof filteredProducts> = {};
  
  filteredProducts.forEach(product => {
    const type = product.subSubCategory || "Other Items";
    if (!groupedProducts[type]) groupedProducts[type] = [];
    groupedProducts[type].push(product);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative"> 
      
      <CategoryPostButton 
        subCategorySlug={matchedSlug} 
        itemType={matchedItemType} 
        variant="floating" 
      />

      <div className="max-w-7xl mx-auto mb-8">
        <Link href="/" className="text-sm text-gray-500 hover:text-[#00529b]">← Back to Home</Link>
        <h1 className="text-3xl font-bold text-[#00529b] capitalize mt-2">
          {displayTitle} Inventory (My Items)
        </h1>
      </div>

      <div className="max-w-7xl mx-auto">
        {Object.keys(groupedProducts).length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>You haven't posted any products in "{displayTitle}" yet.</p>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([subType, items]) => (
            <section key={subType} className="mb-12">
              
              <div className="flex items-center gap-4 mb-4 border-b pb-2">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-1 h-5 bg-[#00529b] rounded-full"></span>
                  {subType}
                </h2>
                <CategoryPostButton 
                  subCategorySlug={matchedSlug} 
                  itemType={subType} 
                  variant="inline" 
                />
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                {items.map((product) => {
                  const status = product.status ? product.status.toLowerCase() : "pending";
                  
                  const isApproved = status === "approved";
                  const isRejected = status === "rejected";
                  const isPending = !isApproved && !isRejected; // Default to pending if neither
                  
                  // --- DYNAMIC STYLES ---
                  let cardStyle = "bg-white border-gray-100 hover:shadow-md"; // Default (Approved)
                  
                  if (isPending) {
                    cardStyle = "bg-yellow-50/50 border-yellow-100 opacity-90";
                  } else if (isRejected) {
                    cardStyle = "bg-red-50 border-red-200 opacity-90"; // Red style for rejected
                  }

                  return (
                    <div 
                      key={product.id} 
                      className={`rounded-xl shadow-sm border p-3 transition-all relative group ${cardStyle}`}
                    >
                      {/* Delete Button */}
                      <div className="relative z-20">
                        <DeleteButton productId={product.id} productName={product.name} />
                      </div>

                      {/* --- LINK TO PREVIEW --- */}
                      <Link href={`/product/${product.slug}`} className="block relative mt-1 group-hover:opacity-100 transition-opacity">
                        
                        {/* --- STATUS BADGES --- */}
                        <div className="absolute top-0 right-0 z-10 flex flex-col items-end gap-1">
                          
                          {/* 1. REJECTED BADGE */}
                          {isRejected && (
                             <div className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-red-200">
                               <XCircle size={10} /> Rejected
                             </div>
                          )}

                          {/* 2. PENDING BADGE */}
                          {isPending && (
                             <div className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-yellow-200">
                               <Lock size={10} /> Pending
                             </div>
                          )}

                          {/* 3. LIVE BADGE */}
                          {isApproved && (
                             <div className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-green-200">
                               <CheckCircle size={10} /> Live
                             </div>
                          )}

                          {/* Preview Indicator (Shows on hover for all) */}
                          <div className="bg-white/90 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm backdrop-blur-sm">
                            <Eye size={10} /> Preview
                          </div>
                        </div>

                        <div className="relative aspect-square mb-3 bg-white/50 rounded-lg overflow-hidden mt-6">
                          <Image 
                            src={product.image || "https://placehold.co/400?text=No+Image"} 
                            alt={product.name} 
                            fill 
                            className="object-contain p-2 hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        </div>
                        
                        <h3 className={`font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5em] ${isRejected ? 'text-red-800' : 'text-gray-800'}`}>
                          {product.title || product.name}
                        </h3>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className={`font-bold text-sm ${isRejected ? 'text-red-700' : 'text-[#00529b]'}`}>
                            ₹{product.price}
                          </span>
                          <span className="text-xs text-gray-500 bg-white/60 px-1.5 py-0.5 rounded">
                            Qty: {product.quantity}
                          </span>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}