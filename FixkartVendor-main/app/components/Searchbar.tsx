"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// 1. Internal component containing the logic
function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }

    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center border border-transparent rounded bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-white/90 transition-shadow w-full shadow-sm">
      <input 
        type="text" 
        placeholder="Search products..." 
        suppressHydrationWarning={true}
        className="flex-grow bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-500 min-w-0"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('q')?.toString()}
      />
      <button className="ml-2 text-gray-500 hover:text-[#00529b]"
      suppressHydrationWarning={true} >
        
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </button>
    </div>
  );
}

// 2. Exported component wrapped in Suspense
// This fixes the build error by telling Next.js to wait for client-side hydration
export default function SearchBar() {
  return (
    <Suspense fallback={<div className="w-full h-10 bg-white/20 rounded animate-pulse" />}>
      <SearchInput />
    </Suspense>
  );
}