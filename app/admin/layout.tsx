"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AdminSidebar from "@/components/admin/sidebar";
import AdminNavbar from "@/components/admin/navbar";
import AdminBreadcrumbs from "@/components/admin/breadcrumbs";
import { VendorProvider } from "@/components/admin/vendor-context";

const ADMIN_EMAILS = ["jka8685@gmail.com", "info@thefixkart.com", "sidak798@gmail.com"];
export const dynamic = "force-dynamic";
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        if (!isLoaded) return;

        if (!user) {
            router.replace("/sign-in");
            return;
        }

        const email = user.primaryEmailAddress?.emailAddress;
        if (!email || !ADMIN_EMAILS.includes(email)) {
            router.replace("/unauthorized");
        }
    }, [user, isLoaded, router]);

    if (!isLoaded) return null;

    return (
        <VendorProvider>
            <div className="flex h-screen overflow-hidden">
                <AdminSidebar isOpen={isSidebarOpen} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <AdminNavbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

                    <div className="px-6 py-3 bg-background border-b flex-shrink-0">
                        <AdminBreadcrumbs />
                    </div>

                    <main className="flex-1 overflow-y-auto p-6 bg-muted/40">
                        {children}
                    </main>
                </div>
            </div>
        </VendorProvider>
    );
}
