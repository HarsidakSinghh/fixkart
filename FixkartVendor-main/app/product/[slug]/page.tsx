import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { 
  Package, 
  ChevronRight, 
  Home, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff,
  BarChart3
} from "lucide-react";

// Reuse the Gallery Component
import ProductImageGallery from "@/components/ProductImageGallery";

export const dynamic = "force-dynamic";

export default async function VendorProductDetailsPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  // 1. Fetch Product (Ensure it belongs to this vendor)
  const product = await prisma.product.findUnique({
    where: { slug: slug },
  });

  // Security Check: Must exist and belong to the logged-in vendor
  if (!product || product.vendorId !== userId) {
    return notFound();
  }

  // Helper for Specs
  const specs = (product.specs as Record<string, string>) || {};

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      
      {/* --- BREADCRUMBS --- */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center text-xs md:text-sm text-gray-500">
            <Link href="/vendor/dashboard" className="flex items-center hover:text-[#00529b] transition-colors">
              <Home size={14} className="mr-1" /> Dashboard
            </Link>
            <ChevronRight size={14} className="mx-2 text-gray-300" />
            <Link href="/vendor/products" className="hover:text-[#00529b] transition-colors">
              Inventory
            </Link>
            <ChevronRight size={14} className="mx-2 text-gray-300" />
            <span className="font-semibold text-gray-800 truncate max-w-[200px]">
              {product.title || product.name}
            </span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* --- LEFT: IMAGE GALLERY --- */}
          <div className="lg:col-span-5">
             <div className="sticky top-24">
                <ProductImageGallery 
                  mainImage={product.image} 
                  gallery={product.gallery} 
                  title={product.title || product.name} 
                />
             </div>
          </div>

          {/* --- RIGHT: VENDOR CONTROLS & DETAILS --- */}
          <div className="lg:col-span-7 flex flex-col h-full">
            
            {/* 1. Header & Status */}
            <div className="border-b border-gray-100 pb-6 mb-6">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[#00529b] font-bold text-xs tracking-widest uppercase">
                  {product.brand || "Generic"}
                </p>
                {/* Status Badge */}
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                  product.isPublished 
                    ? "bg-green-50 text-green-700 border-green-200" 
                    : "bg-yellow-50 text-yellow-700 border-yellow-200"
                }`}>
                  {product.isPublished ? "Live / Published" : "Draft / Hidden"}
                </span>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
                {product.title || product.name}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                 <span>Category: <span className="font-medium text-gray-800">{product.subCategory}</span></span>
                 <span className="text-gray-300">|</span>
                 <span>SKU: <span className="font-medium text-gray-800">{product.sku || "N/A"}</span></span>
              </div>
            </div>

            {/* 2. VENDOR ACTION BAR */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-8 shadow-sm">
               <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">Management Controls</h3>
               <div className="flex flex-wrap gap-3">
                  
                  {/* EDIT BUTTON - Fixed Link */}
                  <Link 
                    href={`/vendor/products/edit/${product.id}`} 
                    className="flex-1 min-w-[140px] bg-[#00529b] text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-800 transition flex items-center justify-center gap-2"
                  >
                    <Edit3 size={18} /> Edit Product
                  </Link>

                  {/* PREVIEW BUTTON */}
                  <Link 
                    href={`/product/${product.slug}`} 
                    target="_blank"
                    className="flex-1 min-w-[140px] bg-white border border-gray-300 text-gray-700 font-bold py-3 px-4 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                  >
                    <Eye size={18} /> View Live
                  </Link>

                  {/* TOGGLE STATUS (Mock Button) */}
                  <form action={async () => {
                    "use server";
                    // Add server action to toggle isPublished here
                  }}>
                     <button className="h-full px-4 rounded-lg border border-gray-300 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-400 transition" title="Toggle Visibility">
                        {product.isPublished ? <EyeOff size={20} /> : <Eye size={20} />}
                     </button>
                  </form>

                  {/* DELETE BUTTON (Mock Button) */}
                  <form action={async () => {
                     "use server";
                     // Add server action to delete product here
                  }}>
                    <button className="h-full px-4 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition" title="Delete Product">
                       <Trash2 size={20} />
                    </button>
                  </form>
               </div>
            </div>

            {/* 3. Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                  <span className="text-xs text-gray-400 font-bold uppercase">Selling Price</span>
                  <div className="text-2xl font-bold text-[#00529b] mt-1">
                    ₹{product.price.toLocaleString("en-IN")}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Per Unit</p>
               </div>
               <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                  <span className="text-xs text-gray-400 font-bold uppercase">Current Inventory</span>
                  <div className={`text-2xl font-bold mt-1 ${product.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                    {product.quantity}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                     <Package size={10} /> Units in stock
                  </p>
               </div>
            </div>

            {/* 4. Description */}
            <div className="mb-8">
               <h3 className="font-bold text-gray-900 border-l-4 border-[#00529b] pl-3 mb-4 text-lg">
                 Description
               </h3>
               <div className="text-gray-600 text-sm leading-7 space-y-4">
                  <p>{product.description || "No description set."}</p>
               </div>
            </div>

            {/* 5. Performance Teaser */}
            <div className="mt-auto bg-blue-50 p-4 rounded-lg flex items-center gap-3 text-blue-800 text-sm border border-blue-100">
               <BarChart3 size={20} />
               <span>
                  <strong>Pro Tip:</strong> Add high-quality images to increase sales.
               </span>
            </div>

          </div>
        </div>

        {/* --- BOTTOM SECTION: SPECS TABLE --- */}
        {Object.keys(specs).length > 0 && (
          <div className="mt-12 pt-10 border-t border-gray-200">
             <div className="max-w-4xl">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                   Technical Specifications
                </h3>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                   <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-gray-100">
                         {Object.entries(specs).map(([key, value], index) => (
                            <tr key={key} className={index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}>
                               <td className="px-6 py-4 font-medium text-gray-500 capitalize w-1/3">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                               </td>
                               <td className="px-6 py-4 font-semibold text-gray-800">
                                  {value}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

      </main>
    </div>
  );
}