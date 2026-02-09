"use client";

import React, { useState } from "react";
import Image from "next/image";

interface GalleryProps {
  mainImage: string;
  gallery: string[];
  title: string;
}

export default function ProductImageGallery({ mainImage, gallery, title }: GalleryProps) {
  // Combine main image and gallery into one list, removing duplicates/empties
  const allImages = Array.from(new Set([mainImage, ...(gallery || [])])).filter(Boolean);
  
  const [selectedImage, setSelectedImage] = useState(allImages[0]);

  return (
    <div className="flex flex-col gap-4">
      
      {/* 1. Main Large Image */}
      <div className="relative w-full aspect-square bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group">
        <Image 
          src={selectedImage || "https://placehold.co/600?text=No+Image"}
          alt={title}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
      </div>

      {/* 2. Thumbnail Grid (Only if more than 1 image) */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {allImages.map((img, index) => (
            <button 
              key={index}
              onClick={() => setSelectedImage(img)}
              className={`relative aspect-square border-2 rounded-lg overflow-hidden transition-all ${
                selectedImage === img 
                  ? "border-[#00529b] ring-2 ring-[#00529b]/20" 
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <Image 
                src={img}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}