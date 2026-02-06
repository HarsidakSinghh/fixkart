"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateVendorStatus } from "@/app/admin/actions"; // Ensure you have this file from previous steps
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/admin/confirm-dialog";

type Vendor = {
    id: string;
    fullName: string;
    email: string;
    status: string;
};

export default function PendingVendorsTable({ initialVendors }: { initialVendors: Vendor[] }) {
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Search Filter Logic
    const filteredVendors = initialVendors.filter((v) =>
        v.fullName.toLowerCase().includes(search.toLowerCase()) ||
        v.email.toLowerCase().includes(search.toLowerCase())
    );

    // Handle Approve / Reject
    const handleStatusUpdate = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
        setIsLoading(true);
        const result = await updateVendorStatus(id, newStatus);

        if (result.success) {
            // The router.refresh() inside the server action will auto-reload the page data
            setIsLoading(false);
        } else {
            alert("Failed to update status");
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Bar */}
            <Input
                placeholder="Search vendor by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            <div className="rounded-md border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredVendors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No pending vendors found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredVendors.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell className="font-medium">{vendor.fullName}</TableCell>
                                    <TableCell>{vendor.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                            {vendor.status}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                                        >
                                            View Profile
                                        </Button>

                                        {/* Approve Button */}
                                        <ConfirmDialog
                                            title="Approve Vendor"
                                            description="This will give the vendor access to their dashboard."
                                            toastTitle="Vendor Approved"
                                            toastDescription={`${vendor.fullName} has been approved.`}
                                            onConfirm={() => handleStatusUpdate(vendor.id, "APPROVED")}
                                            trigger={
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                                                    Approve
                                                </Button>
                                            }
                                        />

                                        {/* Reject Button */}
                                        <ConfirmDialog
                                            title="Reject Vendor"
                                            description="This will block the vendor's application."
                                            toastTitle="Vendor Rejected"
                                            toastDescription="Application rejected."
                                            variant="destructive"
                                            onConfirm={() => handleStatusUpdate(vendor.id, "REJECTED")}
                                            trigger={
                                                <Button size="sm" variant="destructive" disabled={isLoading}>
                                                    Reject
                                                </Button>
                                            }
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}