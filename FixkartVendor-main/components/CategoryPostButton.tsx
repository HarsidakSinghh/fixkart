"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import VendorModal from "@/components/VendorModal"; 
import { getVendorStatus } from "@/app/actions/vendor";

interface CategoryPostButtonProps {
  subCategorySlug?: string;
  itemType?: string; // <--- NEW PROP: Specific Sub-Sub Category (e.g., "Anchors")
  variant?: "floating" | "inline"; // Style variant
}

export default function CategoryPostButton({ 
  subCategorySlug, 
  itemType, 
  variant = "floating" 
}: CategoryPostButtonProps) {
  
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [checkingVendor, setCheckingVendor] = useState(false);

  const handlePostClick = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setCheckingVendor(true);
    try {
      const status = await getVendorStatus();

      if (!status) {
        router.push("/vendor-onboarding");
      } else if (status === "PENDING") {
        alert("Your vendor account is currently under review. Please wait for admin approval.");
      } else if (status === "REJECTED") {
        alert("Your vendor application was rejected. Please contact support.");
      } else if (status === "APPROVED") {
        setIsVendorModalOpen(true);
      }

    } catch (error) {
      console.error("Failed to check vendor status");
    } finally {
      setCheckingVendor(false);
    }
  };

  return (
    <>
      <VendorModal 
        isOpen={isVendorModalOpen} 
        onClose={() => setIsVendorModalOpen(false)} 
        preSelectedSubCategorySlug={subCategorySlug} 
        preSelectedItemType={itemType} // <--- Pass it to Modal
      />

      {variant === "floating" ? (
        <button
          onClick={handlePostClick}
          disabled={checkingVendor}
          suppressHydrationWarning={true}
          className={`fixed bottom-6 right-6 z-[60] text-white font-bold py-3 px-6 rounded-full shadow-2xl transition-transform hover:scale-105 flex items-center gap-2 border-2 border-white/20 backdrop-blur-sm ${
            isSignedIn ? "bg-green-600 hover:bg-green-700" : "bg-[#00529b] hover:bg-blue-800"
          } ${checkingVendor ? "opacity-70 cursor-wait" : ""}`}
        >
          <span>
            {!isSignedIn ? "Login to Post" : checkingVendor ? "Checking..." : "+ Post Item Here"}
          </span>
        </button>
      ) : (
        /* INLINE VARIANT (Small button for section headers) */
        <button
          onClick={handlePostClick}
          disabled={checkingVendor}
          className="ml-4 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold hover:bg-green-200 transition-colors flex items-center gap-1"
        >
          <span>+ Add to {itemType}</span>
        </button>
      )}
    </>
  );
}