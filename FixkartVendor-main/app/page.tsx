import React, { Suspense } from "react";
import InventoryContent from "@/components/InventoryContent";
import { Analytics } from "@vercel/analytics/next"

// This is a Server Component. It runs on the backend.
export default async function HomePage() {
  
  // Note: We removed the DB fetching here because the Homepage 
  // now only shows static Category Folders.
  // The actual DB products are loaded dynamically in the /browse/[slug] page.

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header Spacer (if you have a fixed header) */}
      <div className="w-full h-[70px]"></div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00529b]"></div>
          </div>
        }
      >
      <Analytics/>
        {/* Update: No longer passing dbProducts, so no type error */}
        <InventoryContent />
      </Suspense>
    </div>
  );
}