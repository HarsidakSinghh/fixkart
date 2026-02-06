"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Truck } from "lucide-react";

interface RefundRequestData {
    id: string;
    orderItemId: string;
    productName: string;
    productImage?: string;
    customerName: string;
    customerId: string;
    vendorName: string;
    reason: string;
    status: string;
    createdAt: string;
    amount: number;
    price: number;
    quantity: number;
    orderId?: string;
    billUrl?: string | null;
    transportSlipUrl?: string | null;
}

export default function RefundsTable({ initialRefunds }: { initialRefunds: RefundRequestData[] }) {
    const [refunds, setRefunds] = useState<RefundRequestData[]>(initialRefunds);
    const [search, setSearch] = useState("");

    const router = useRouter();

    const filteredRefunds = refunds.filter(r =>
        r.productName.toLowerCase().includes(search.toLowerCase()) ||
        r.customerName.toLowerCase().includes(search.toLowerCase()) ||
        r.vendorName.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.orderId?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        let color = "bg-yellow-100 text-yellow-800 border-yellow-200";
        if (status === "ACCEPTED" || status === "APPROVED") color = "bg-green-100 text-green-800 border-green-200";
        if (status === "REJECTED") color = "bg-red-100 text-red-800 border-red-200";

        return (
            <Badge className={`shadow-none font-normal ${color} hover:${color}`}>
                {status}
            </Badge>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search refunds by Order ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8"
                />
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product & Order</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRefunds.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No refund requests found</TableCell></TableRow>
                        ) : (
                            filteredRefunds.map((refund) => (
                                <TableRow
                                    key={refund.id}
                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => router.push(`/admin/refunds/${refund.id}`)}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {refund.productImage && (
                                                <img src={refund.productImage} alt="" className="h-8 w-8 rounded border object-cover" />
                                            )}
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{refund.productName}</span>
                                                <span className="text-xs text-muted-foreground">Order: {refund.orderId ? refund.orderId.slice(-6).toUpperCase() : 'N/A'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{refund.customerName}</span>
                                            <span className="text-xs text-muted-foreground">ID: {refund.customerId.slice(-4)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm">{refund.vendorName}</span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1 text-sm">
                                            <span title={refund.reason} className="max-w-[150px] truncate text-muted-foreground italic">
                                                "{refund.reason}"
                                            </span>
                                            <div className="font-mono text-xs">
                                                {refund.quantity} x ₹{refund.price} = ₹{refund.amount}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {refund.billUrl ? (
                                                <Button size="icon" variant="outline" className="h-8 w-8" asChild title="View Bill">
                                                    <a href={refund.billUrl} target="_blank" rel="noopener noreferrer">
                                                        <FileText className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            ) : <span className="text-xs text-muted-foreground">No Bill</span>}

                                            {refund.transportSlipUrl ? (
                                                <Button size="icon" variant="outline" className="h-8 w-8" asChild title="View Transport Slip">
                                                    <a href={refund.transportSlipUrl} target="_blank" rel="noopener noreferrer">
                                                        <Truck className="h-4 w-4" />
                                                    </a>
                                                </Button>
                                            ) : null}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(refund.status)}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                        {new Date(refund.createdAt).toLocaleDateString()}
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
