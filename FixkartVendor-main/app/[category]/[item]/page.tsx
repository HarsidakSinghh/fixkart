"use client";

import React, { useState, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// --- TYPE DEFINITIONS ---
type Variant = {
  id: string;
  size: string;
  material: string;
  price: number;
  stock: number;
};

type ProductDetails = {
  title: string;
  description: string;
  image: string;
  variants: Variant[];
};

// --- MOCK DATABASE (Fake Backend Data) ---
// Asal mein yeh data aapke backend API se aayega.
// Abhi ke liye hum yahan static data define kar rahe hain.
const MOCK_DB: Record<string, ProductDetails> = {
  "bolts": {
    title: "Industrial Hex Bolts",
    description: "High-strength hexagonal bolts suitable for construction and machinery.",
    image: "/fastening/bolts.webp", // Ensure this path matches your public folder
    variants: [
      { id: "b1", size: "M6 x 20mm", material: "Stainless Steel", price: 15, stock: 100 },
      { id: "b2", size: "M6 x 40mm", material: "Stainless Steel", price: 18, stock: 50 },
      { id: "b3", size: "M8 x 30mm", material: "Zinc Plated", price: 25, stock: 0 }, // Out of stock example
      { id: "b4", size: "M10 x 50mm", material: "High Tensile Steel", price: 45, stock: 200 },
    ]
  },
  "screws": {
    title: "General Purpose Screws",
    description: "Versatile screws for wood and metal applications.",
    image: "/fastening/screws.jpg",
    variants: [
      { id: "s1", size: "#8 x 1 inch", material: "Brass", price: 5, stock: 500 },
      { id: "s2", size: "#10 x 2 inch", material: "Steel", price: 8, stock: 300 },
    ]
  },
  // Default fallback for items not explicitly defined above
  "default": {
    title: "Generic Product",
    description: "Standard industrial fastening component.",
    image: "https://placehold.co/400x400/f3f4f6/00529b.png?text=Product",
    variants: [
      { id: "d1", size: "Standard Size A", material: "Steel", price: 100, stock: 50 },
      { id: "d2", size: "Standard Size B", material: "Alloy", price: 150, stock: 25 },
    ]
  }
};

// --- MAIN PAGE COMPONENT ---
export default function ProductListingPage({ params }: { params: Promise<{ category: string; item: string }> }) {
  // UNWRAP PARAMS using React.use() (Required in Next.js 15+)
  const { category, item } = use(params);

  // URL se item ka slug (e.g., 'bolts') nikaal rahe hain
  const itemSlug = item.toLowerCase();
  
  // Data fetch kar rahe hain (Mock DB se)
  // Agar item DB mein nahi hai, to 'default' data dikhayega
  const product = MOCK_DB[itemSlug] || { 
    ...MOCK_DB["default"], 
    title: item.replace(/-/g, ' ').toUpperCase() // Fallback title from URL
  };

  // State for cart quantities (Har variant ke liye alag quantity store karega)
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = (variantId: string, val: string) => {
    const value = Math.max(0, parseInt(val) || 0);
    setQuantities(prev => ({ ...prev, [variantId]: value }));
  };

  const addToCart = (variant: Variant) => {
    const qty = quantities[variant.id] || 0;
    if (qty > 0) {
      alert(`Added ${qty} x ${variant.size} to cart!`);
      // Yahan aap apne Context ya Redux store mein 'addToCart' action call karenge
    } else {
      alert("Please select a quantity first.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 md:px-8">
      
      {/* Breadcrumb Navigation */}
      <div className="max-w-6xl mx-auto mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#00529b] hover:underline">Home</Link>
        <span className="mx-2">/</span>
        <span className="capitalize">{category.replace(/-/g, ' ')}</span>
        <span className="mx-2">/</span>
        <span className="font-bold text-gray-800 capitalize">{product.title}</span>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        
        {/* HEADER SECTION: Image & Description */}
        <div className="flex flex-col md:flex-row p-6 md:p-10 gap-8 border-b border-gray-100">
          <div className="w-full md:w-1/3 flex justify-center bg-gray-50 rounded-lg p-4">
             <div className="relative w-64 h-64">
               <Image
                 src={product.image}
                 alt={product.title}
                 fill
                 className="object-contain"
                 unoptimized // Remove this if using real optimized images
               />
             </div>
          </div>
          
          <div className="w-full md:w-2/3">
            <h1 className="text-3xl font-bold text-[#00529b] mb-2">{product.title}</h1>
            <p className="text-gray-600 text-lg mb-6">{product.description}</p>
            
            <div className="bg-blue-50 text-[#00529b] px-4 py-2 rounded-md inline-block text-sm font-semibold">
              In Stock & Ready to Ship
            </div>
          </div>
        </div>

        {/* VARIANTS TABLE SECTION */}
        <div className="p-6 md:p-10 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Select Size & Quantity</h2>
          
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                <th className="py-4 font-semibold">Size / Dimensions</th>
                <th className="py-4 font-semibold">Material</th>
                <th className="py-4 font-semibold text-right">Price (Unit)</th>
                <th className="py-4 font-semibold text-center">Stock</th>
                <th className="py-4 font-semibold text-center w-32">Quantity</th>
                <th className="py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {product.variants.map((variant) => {
                const isOutOfStock = variant.stock === 0;
                
                return (
                  <tr key={variant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-medium text-gray-800">{variant.size}</td>
                    <td className="py-4 text-gray-600">{variant.material}</td>
                    <td className="py-4 text-right font-bold text-[#00529b]">
                      ₹{variant.price.toFixed(2)}
                    </td>
                    <td className="py-4 text-center">
                      {isOutOfStock ? (
                        <span className="text-red-500 text-xs font-bold bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                      ) : (
                        <span className="text-green-600 text-sm">{variant.stock} available</span>
                      )}
                    </td>
                    <td className="py-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max={variant.stock}
                        disabled={isOutOfStock}
                        value={quantities[variant.id] || ''}
                        onChange={(e) => handleQuantityChange(variant.id, e.target.value)}
                        placeholder="0"
                        className="w-20 p-2 border border-gray-300 rounded text-center focus:outline-none focus:border-[#00529b] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => addToCart(variant)}
                        disabled={isOutOfStock || (quantities[variant.id] || 0) === 0}
                        className={`
                          px-4 py-2 rounded-md font-medium text-sm transition-all
                          ${isOutOfStock || (quantities[variant.id] || 0) === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-[#00529b] text-white hover:bg-blue-800 shadow-sm active:scale-95'
                          }
                        `}
                      >
                        Add to Cart
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {product.variants.length === 0 && (
             <div className="text-center py-10 text-gray-400">
                No variants available for this item.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}