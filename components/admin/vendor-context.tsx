"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * This type now maps to VendorProfile from Prisma
 * (you can extend it later with analytics fields)
 */
export type Vendor = {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    gstNumber?: string;
    address: string;
    city: string;
    state: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
    createdAt: string;

    // Optional (future dashboard metrics)
    totalOrders?: number;
    totalRevenue?: number;
};

type VendorContextType = {
    vendors: Vendor[];
    loading: boolean;
    approveVendor: (id: string) => Promise<void>;
    rejectVendor: (id: string) => Promise<void>;
    suspendVendor: (id: string) => Promise<void>;
    reactivateVendor: (id: string) => Promise<void>;
    refetch: () => Promise<void>;
};

const VendorContext = createContext<VendorContextType | null>(null);

export function VendorProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    /* ---------------- FETCH VENDORS ---------------- */

    const refetch = async () => {
        setLoading(true);
        try {
            // Default = pending vendors (used by Vendors page)
            const res = await fetch("/api/admin/vendors?status=PENDING", {
                cache: "no-store",
            });
            const data = await res.json();
            setVendors(data);
        } catch (err) {
            console.error("Failed to fetch vendors", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refetch();
    }, []);

    /* ---------------- ACTIONS ---------------- */

    const updateStatus = async (
        id: string,
        status: "APPROVED" | "REJECTED" | "SUSPENDED"
    ) => {
        await fetch(`/api/admin/vendors/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        await refetch();
    };

    const approveVendor = async (id: string) => {
        await updateStatus(id, "APPROVED");
    };

    const rejectVendor = async (id: string) => {
        await updateStatus(id, "REJECTED");
    };

    const suspendVendor = async (id: string) => {
        await updateStatus(id, "SUSPENDED");
    };

    const reactivateVendor = async (id: string) => {
        await updateStatus(id, "APPROVED");
    };

    return (
        <VendorContext.Provider
            value={{
                vendors,
                loading,
                approveVendor,
                rejectVendor,
                suspendVendor,
                reactivateVendor,
                refetch,
            }}
        >
            {children}
        </VendorContext.Provider>
    );
}

export function useVendors() {
    const ctx = useContext(VendorContext);
    if (!ctx) {
        throw new Error("useVendors must be used inside VendorProvider");
    }
    return ctx;
}
