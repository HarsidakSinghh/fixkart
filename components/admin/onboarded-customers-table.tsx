// components/admin/onboarded-customers-table.tsx
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/admin/confirm-dialog";

type Customer = {
    id: string;
    fullName: string;
    companyName: string;
    email: string;
    status: string;
};

export default function OnboardedCustomersTable({ initialCustomers }: { initialCustomers: Customer[] }) {
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const filteredCustomers = initialCustomers.filter((c) =>
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.companyName.toLowerCase().includes(search.toLowerCase())
    );

    const handleStatusUpdate = async (id: string, newStatus: "APPROVED" | "SUSPENDED") => {
        setIsLoading(true);
        const result = await updateCustomerStatus(id, newStatus);
        setIsLoading(false);

        if (!result.success) {
            alert("Failed to update customer");
        }
    };

    return (
        <div className="space-y-4">
            <Input
                placeholder="Search customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
            />

            {filteredCustomers.length === 0 && (
                <p className="text-muted-foreground">No customers found</p>
            )}

            {filteredCustomers.length > 0 && (
                <div className="rounded-md border bg-background">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell className="font-medium">
                                        {customer.fullName}
                                    </TableCell>
                                    <TableCell>{customer.companyName}</TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={customer.status === "SUSPENDED" ? "destructive" : "default"}>
                                            {customer.status}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => router.push(`/admin/customers/${customer.id}`)}
                                        >
                                            View Profile
                                        </Button>

                                        {customer.status === "APPROVED" && (
                                            <ConfirmDialog
                                                title="Suspend Customer"
                                                description="This customer will be blocked from accessing the platform."
                                                toastTitle="Customer Suspended"
                                                toastDescription={`${customer.fullName} has been suspended.`}
                                                variant="destructive"
                                                onConfirm={() => handleStatusUpdate(customer.id, "SUSPENDED")}
                                                trigger={
                                                    <Button size="sm" variant="destructive" disabled={isLoading}>
                                                        Suspend
                                                    </Button>
                                                }
                                            />
                                        )}

                                        {customer.status === "SUSPENDED" && (
                                            <ConfirmDialog
                                                title="Reactivate Customer"
                                                description="This customer will be allowed to access the platform again."
                                                toastTitle="Customer Reactivated"
                                                toastDescription={`${customer.fullName} is now active.`}
                                                onConfirm={() => handleStatusUpdate(customer.id, "APPROVED")}
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
        </div>
    );
}
