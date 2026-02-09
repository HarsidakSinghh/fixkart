"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
// REMOVED: useAuth, checkIsVendor (not needed here anymore)
import Image from "next/image";
import Link from "next/link";
// REMOVED: VendorModal import
import { INVENTORY_DATA, SIDEBAR_LINKS } from "@/app/data/inventory"; 

// --- CONFIGURATION ---
const STICKY_HEADER_TOP = "140px";
const HEADER_HEIGHT_OFFSET = 180;

// --- UTILS ---
const toSlug = (text: string) =>
  text.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

// --- ICONS ---
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
);

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
);

export default function InventoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q")?.toLowerCase() || "";

  // 1. STATE
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // REMOVED: isVendorModalOpen state

  // REMOVED: handlePostClick function

  // 3. FILTERING STATIC DATA
  const filteredData = useMemo(() => {
    if (!searchQuery) return INVENTORY_DATA;
    return INVENTORY_DATA.map((category) => {
      const matchingItems = category.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery)
      );
      return { ...category, items: matchingItems };
    }).filter((category) => category.items.length > 0);
  }, [searchQuery]);

  // 4. SCROLL SPY
  useEffect(() => {
    const sections = document.querySelectorAll("section");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategorySlug(entry.target.id);
          }
        });
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [filteredData]);

  // 5. SMOOTH SCROLL HANDLER
  const handleScroll = useCallback(
    (e: React.MouseEvent, id: string, closeMenu?: boolean) => {
      e.preventDefault();
      setActiveCategorySlug(id);
      if (closeMenu) setIsMobileMenuOpen(false);

      const element = document.getElementById(id);
      if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - HEADER_HEIGHT_OFFSET;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
    },
    []
  );

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isMobileMenuOpen]);

  return (
    <div className="w-full flex flex-col md:flex-row relative min-h-screen">
      
      {/* REMOVED: UserButton (already in layout) */}
      {/* REMOVED: VendorModal component */}
      {/* REMOVED: Floating Post Item Button */}

      {/* --- HAMBURGER MENU --- */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        suppressHydrationWarning={true}
        className="md:hidden fixed top-3 left-4 z-[100] text-white p-1 hover:bg-white/10 rounded-md transition-colors"
        aria-label="Open Categories"
      >
        <MenuIcon />
      </button>

      {/* --- MOBILE DRAWER --- */}
      <div
        className={`md:hidden fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[80] shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-lg font-bold text-[#00529b]">Browse Categories</h2>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            suppressHydrationWarning={true}
            className="p-2 bg-white rounded-full shadow-sm text-gray-500"
          >
            <XIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {SIDEBAR_LINKS.map((linkName, index) => {
              const catSlug = INVENTORY_DATA.find((c) => c.title === linkName)?.slug || "";
              const isActive = activeCategorySlug === catSlug;
              return (
                <li key={index}>
                  <a
                    href={`#${catSlug}`}
                    onClick={(e) => handleScroll(e, catSlug, true)}
                    className={`block px-3 py-3 rounded-lg text-sm transition-all duration-200 font-medium ${
                      isActive ? "bg-blue-50 text-[#00529b] border-l-4 border-[#00529b]" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {linkName}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:block w-64 shrink-0 py-6 pl-6 pr-4 border-r border-gray-200 sticky top-[130px] h-[calc(100vh-130px)] overflow-y-auto custom-scrollbar">
        <h2 className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-4">
          Browse Categories
        </h2>
        <ul className="space-y-1 text-[13px] leading-tight text-gray-700">
          {SIDEBAR_LINKS.map((linkName, index) => {
            const catSlug = INVENTORY_DATA.find((c) => c.title === linkName)?.slug || "";
            const isActive = activeCategorySlug === catSlug;
            return (
              <li key={index}>
                <a
                  href={`#${catSlug}`}
                  onClick={(e) => handleScroll(e, catSlug)}
                  className={`block px-3 py-2 rounded-md transition-all duration-200 cursor-pointer select-none ${
                    isActive ? "bg-[#e6f0fa] text-[#00529b] font-bold" : "hover:bg-gray-100 hover:text-[#00529b]"
                  }`}
                >
                  {linkName}
                </a>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 p-4 md:p-8 min-h-screen bg-gray-50/30">
        {searchQuery && (
          <div className="mb-8 p-4 bg-white border border-yellow-200 rounded-lg shadow-sm text-sm text-gray-700 flex items-center justify-between">
            <span>Results for: <strong>"{searchQuery}"</strong></span>
            <Link href="/" className="text-blue-600 text-xs font-bold uppercase hover:underline">Clear</Link>
          </div>
        )}

        {filteredData.map((category: any) => (
          <section
            key={category.slug}
            id={category.slug}
            className="mb-10 scroll-mt-48 md:scroll-mt-40"
          >
            <div
              className="sticky z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 py-3 mb-6 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent md:border-none"
              style={{ top: STICKY_HEADER_TOP }}
            >
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#00529b] rounded-full inline-block"></span>
                {category.title}
              </h1>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-8">
              {category.items.map((item: any, idx: number) => (
                <Link
                  key={`${category.slug}-${item.name}-${idx}`}
                  href={`/browse/${toSlug(item.name)}`} 
                >
                  <ProductCard item={item} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

// ... (ProductCard Component remains the same) ...
const ProductCard = React.memo(function ProductCard({ item }: { item: any }) {
  const encodedName = encodeURIComponent(item.name);
  let primaryPath = item.imagePath ? item.imagePath.replace(/\\/g, "/") : "";
  if (primaryPath && !primaryPath.startsWith("/") && !primaryPath.startsWith("http")) primaryPath = "/" + primaryPath;
  const fallbackUrl = `https://placehold.co/400x400/f3f4f6/00529b.png?text=${encodedName}&font=roboto`;
  const [imgSrc, setImgSrc] = useState(primaryPath || fallbackUrl);

  return (
    <div className="flex flex-col items-center group cursor-pointer w-full h-full bg-white rounded-lg p-2 transition-all hover:bg-white hover:shadow-lg relative">
      <div className="aspect-square w-full max-w-[120px] bg-white border border-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative shadow-sm">
        <Image src={imgSrc} alt={item.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-contain p-2 group-hover:scale-105 transition-transform duration-300" unoptimized={true} onError={() => setImgSrc(fallbackUrl)} />
      </div>
      <span className="text-[13px] text-center leading-snug font-medium px-1 line-clamp-2 text-gray-600 group-hover:text-[#00529b]">
        {item.name}
      </span>
    </div>
  );
});