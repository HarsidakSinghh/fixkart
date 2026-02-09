"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    RefreshCw,
    AlertCircle,
    Users,
    FileText,
    Menu,
    X
} from "lucide-react";
import { SignedIn, UserButton } from "@clerk/nextjs";

interface VendorSidebarProps {
    user: any; // Using any for simplicity as User type might be complex to import on client side
}

export default function VendorSidebar({ user }: VendorSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggleSidebar = () => setIsOpen(!isOpen);
    const closeSidebar = () => setIsOpen(false);

    return (
        <>
            {/* --- MOBILE TOGGLE BUTTON --- */}
            <button
                onClick={toggleSidebar}
                className="md:hidden fixed top-20 left-4 z-50 p-2 bg-[#00529b] text-white rounded-md shadow-lg"
                aria-label="Toggle Sidebar"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* --- OVERLAY FOR MOBILE --- */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={closeSidebar}
                />
            )}

            {/* --- SIDEBAR --- */}
            <aside
                className={`
          w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static
        `}
            >
                <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#00529b] rounded-lg flex items-center justify-center text-white font-bold">
                        V
                    </div>
                    <span className="font-bold text-gray-800 text-lg">Vendor Panel</span>
                </div>

                <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
                    <SidebarItem
                        icon={<LayoutDashboard size={20} />}
                        label="Dashboard"
                        href="/vendor/dashboard"
                        currentPath={pathname}
                        onClick={closeSidebar}
                    />

                    <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider px-3">Management</div>
                    <SidebarItem icon={<Package size={20} />} label="My Inventory" href="/vendor/inventory" currentPath={pathname} onClick={closeSidebar} />
                    <SidebarItem icon={<ShoppingCart size={20} />} label="Orders" href="/vendor/orders" currentPath={pathname} onClick={closeSidebar} />
                    <SidebarItem icon={<RefreshCw size={20} />} label="Returns & Refunds" href="/vendor/returns" currentPath={pathname} onClick={closeSidebar} />
                    <SidebarItem icon={<AlertCircle size={20} />} label="Complaints" href="/vendor/complaints" currentPath={pathname} onClick={closeSidebar} />

                    <SidebarItem icon={<Users size={20} />} label="Salesman" href="/vendor/tracking" currentPath={pathname} onClick={closeSidebar} />

                    <div className="pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider px-3">Support & Tools</div>
                    <SidebarItem icon={<FileText size={20} />} label="Listing Guide" href="/vendor/guide" currentPath={pathname} onClick={closeSidebar} />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3">
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.firstName}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

// Helper Component for Sidebar Items
function SidebarItem({
    icon,
    label,
    href,
    currentPath,
    onClick
}: {
    icon: any,
    label: string,
    href: string,
    currentPath: string,
    onClick: () => void
}) {
    const isActive = currentPath === href || (href !== "/vendor/dashboard" && currentPath.startsWith(href));

    return (
        <Link
            href={href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? "bg-[#00529b] text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    );
}
