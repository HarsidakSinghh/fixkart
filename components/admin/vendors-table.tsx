// components/admin/vendors-table.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateVendorStatus } from "@/app/admin/actions"; // Import our new action
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { useToast } from "@/components/ui/use-toast"; // Assuming you have this, otherwise remove
import ConfirmDialog from "@/components/admin/confirm-dialog";
// import VendorDetailsDialog from "@/components/admin/vendor-details-dialog"; // Uncomment if you have this
import VendorStatsDialog from "@/components/admin/vendor-stats-dialog";

// Define the shape of data from Prisma
type Vendor = {
    id: string;
    fullName: string;
    email: string;
    status: string;
    // Add other fields needed for the dialog here
};

export default function VendorsTable({ initialVendors }: { initialVendors: Vendor[] }) {
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    // const { toast } = useToast(); 

    // Filter logic
    const filteredVendors = initialVendors.filter((v) =>
        v.fullName.toLowerCase().includes(search.toLowerCase()) ||
        v.email.toLowerCase().includes(search.toLowerCase())
    );

    // Handler for status updates
    const handleStatusUpdate = async (id: string, newStatus: "APPROVED" | "SUSPENDED") => {
        setIsLoading(true);
        const result = await updateVendorStatus(id, newStatus);
        setIsLoading(false);

        if (!result.success) {
            alert("Failed to update vendor"); // Replace with toast if available
        }
    };

    return (
        <div className="space-y-4">
            {/* Search */}
            <Input
                placeholder="Search vendor by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            {filteredVendors.length === 0 && (
                <p className="text-muted-foreground">No vendors found</p>
            )}

            {filteredVendors.length > 0 && (
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
                            {filteredVendors.map((vendor) => (
                                <TableRow key={vendor.id}>
                                    <TableCell className="font-medium">
                                        {vendor.fullName}
                                    </TableCell>
                                    <TableCell>{vendor.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={vendor.status === "SUSPENDED" ? "destructive" : "default"}>
                                            {vendor.status}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right space-x-2">
                                        {/* View Profile */}
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                                        >
                                            View Profile
                                        </Button>

                                        {/* Stats Action */}
                                        <VendorStatsDialog
                                            vendorId={vendor.id}
                                            vendorName={vendor.fullName}
                                        />

                                        {/* Suspend Action */}
                                        {vendor.status === "APPROVED" && (
                                            <ConfirmDialog
                                                title="Suspend Vendor"
                                                description="This vendor will be blocked from selling."
                                                toastTitle="Vendor Suspended"
                                                toastDescription={`${vendor.fullName} has been suspended.`}
                                                variant="destructive"
                                                onConfirm={() => handleStatusUpdate(vendor.id, "SUSPENDED")}
                                                trigger={
                                                    <Button size="sm" variant="destructive" disabled={isLoading}>
                                                        Suspend
                                                    </Button>
                                                }
                                            />
                                        )}

                                        {/* Reactivate Action */}
                                        {vendor.status === "SUSPENDED" && (
                                            <ConfirmDialog
                                                title="Reactivate Vendor"
                                                description="This vendor will be allowed to sell again."
                                                toastTitle="Vendor Reactivated"
                                                toastDescription={`${vendor.fullName} is now active.`}
                                                onConfirm={() => handleStatusUpdate(vendor.id, "APPROVED")}
                                                trigger={
                                                    <Button size="sm" disabled={isLoading}>
                                                        Reactivate
                                                    </Button>
                                                }
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Note: Pass selectedVendor to your Dialog here if implementing View Popup */}
        </div>
    );
}