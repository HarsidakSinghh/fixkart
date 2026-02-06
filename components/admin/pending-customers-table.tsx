"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerStatus } from "@/app/admin/actions";
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

type Customer = {
    id: string;
    fullName: string;
    email: string;
    status: string;
};

export default function PendingCustomersTable({ initialCustomers }: { initialCustomers: Customer[] }) {
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // Search Filter Logic
    const filteredCustomers = initialCustomers.filter((c) =>
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    // Handle Approve / Reject
    const handleStatusUpdate = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
        setIsLoading(true);
        const result = await updateCustomerStatus(id, newStatus);

        if (result.success) {
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
                placeholder="Search customer by name or cell..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            <div className="rounded-md border bg-background">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Customer</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No pending customers found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">{customer.fullName}</TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                            {customer.status}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => router.push(`/admin/customer-approvals/${customer.id}`)}
                                        >
                                            View Profile
                                        </Button>

                                        {/* Approve Button */}
                                        <ConfirmDialog
                                            title="Approve Customer"
                                            description="This will give the customer access to the platform."
                                            toastTitle="Customer Approved"
                                            toastDescription={`${customer.fullName} has been approved.`}
                                            onConfirm={() => handleStatusUpdate(customer.id, "APPROVED")}
                                            trigger={
                                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                                                    Approve
                                                </Button>
                                            }
                                        />

                                        {/* Reject Button */}
                                        <ConfirmDialog
                                            title="Reject Customer"
                                            description="This will block the customer's application."
                                            toastTitle="Customer Rejected"
                                            toastDescription="Application rejected."
                                            variant="destructive"
                                            onConfirm={() => handleStatusUpdate(customer.id, "REJECTED")}
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
