import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import React from "react";
import Link from "next/link";
import SearchBar from "./components/Searchbar";
import {
  Truck,
  BarChart2,
  Package,
  HelpCircle,
  Settings,
  LayoutDashboard,
  UserCircle // Added icon for salesman
} from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FixKart Vendor Panel",
  description: "Vendor Management Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased text-gray-800 bg-gray-50`}>

        <ClerkProvider>
          {/* --- HEADER CONTAINER --- */}
          <header className="sticky top-0 z-50 shadow-md">

            {/* ROW 1: MAIN BLUE BAR */}
            <div className="w-full bg-[#00529b] border-b border-[#004a8f] py-3 text-white relative z-50">
              <div className="w-full px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">

                {/* 1. Logo */}
                <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity ml-8 md:ml-0">
                  <img
                    src="/fixkart-logo2.png"
                    alt="FixKart"
                    className="h-8 md:h-10 w-auto object-contain"
                  />
                </Link>

                {/* 2. Search Bar (Commented out as in your code) */}
                {/* <div className="order-last md:order-none w-full md:flex-1 max-w-3xl mx-0 md:mx-4 mt-2 md:mt-0">
                  <SearchBar />
                </div> */}

                {/* 3. Right Actions */}
                <div className="flex items-center gap-4 text-sm font-semibold whitespace-nowrap ml-auto md:ml-0">

                  {/* --- UPDATED: SALESMAN LOGIN LINK --- */}
                  <Link
                    href="/salesman/login"
                    // href="#"
                    className="flex items-center gap-2 bg-white/10 px-3 py-1.5 lg:px-4 lg:py-2 rounded-full border border-white/20 hover:bg-white/20 transition-all shadow-sm"
                  >
                    <Truck className="text-[#ffc20e] w-4 h-4 lg:w-[18px] lg:h-[18px]" />

                    {/* Mobile Text */}
                    <span className="text-white font-bold text-[10px] lg:hidden">Salesman Login</span>

                    {/* Desktop Text */}
                    <div className="hidden lg:flex flex-col leading-none">
                      <span className="text-[10px] text-gray-300 font-normal uppercase tracking-wider">Are you a Salesman?</span>
                      <span className="text-white font-bold text-xs">Login Here</span>
                    </div>
                  </Link>

                  {/* Auth Buttons */}
                  <div className="flex items-center gap-2 pl-4 border-l border-white/10">
                    <SignedOut>
                      <SignInButton>
                        <button className="hover:text-gray-200 font-bold text-xs md:text-sm px-2">Sign in</button>
                      </SignInButton>
                      <SignUpButton>
                        <button className="bg-[#ffc20e] text-black px-3 py-1.5 md:px-4 rounded font-bold hover:bg-yellow-500 transition-colors shadow-sm text-xs md:text-sm">
                          Sign up
                        </button>
                      </SignUpButton>
                    </SignedOut>

                    <SignedIn>
                      <UserButton afterSignOutUrl="/" />
                    </SignedIn>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: WHITE SUB-NAVBAR */}
            <div className="w-full bg-white border-b border-gray-200 shadow-sm relative z-40">
              <div className="max-w-[1400px] mx-auto px-4 md:px-6">

                <div className="flex items-center justify-between py-2 overflow-x-auto md:overflow-visible scrollbar-hide">

                  {/* LEFT SIDE ITEMS (Vendor Tools) */}
                  <div className="flex items-center gap-2 md:gap-4 text-sm font-bold text-gray-600 whitespace-nowrap">

                    <Link href="/vendor/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-blue-50 hover:text-[#00529b] transition-all group">
                      <LayoutDashboard size={18} className="group-hover:text-[#00529b]" />
                      <span>Dashboard</span>
                    </Link>

                    <Link href="/vendor/inventory" className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-blue-50 hover:text-[#00529b] transition-all group">
                      <Package size={18} className="group-hover:text-[#00529b]" />
                      <span>Inventory Management</span>
                    </Link>

                    <Link href="/vendor/dashboard/stats" className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-blue-50 hover:text-[#00529b] transition-all group">
                      <BarChart2 size={18} className="group-hover:text-[#00529b]" />
                      <span>Sales & Stats</span>
                    </Link>
                  </div>

                  {/* RIGHT SIDE ITEMS (Support) */}
                  <div className="flex items-center gap-2 md:gap-4 text-sm font-bold text-gray-600 whitespace-nowrap ml-auto">

                    <Link href="/vendor/help" className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-orange-50 hover:text-orange-600 transition-all group">
                      <HelpCircle size={18} className="group-hover:text-orange-600" />
                      <span>Help & Support</span>
                    </Link>

                    <Link href="/vendor/settings" className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-all group">
                      <Settings size={18} className="group-hover:text-[#00529b]" />
                      <span>Settings</span>
                    </Link>
                  </div>

                </div>
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-115px)] w-full">
            <div className="w-full px-4 md:px-6 py-6">
              {children}
            </div>
          </main>

        </ClerkProvider>
      </body>
    </html>
  );
}