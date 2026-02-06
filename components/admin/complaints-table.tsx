"use client";

import { useState } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, MapPin, CreditCard, FileText, Package } from "lucide-react";
import { getCustomerDetails, getOrderDetails } from "@/app/admin/actions";
import { toast } from "sonner";

// Reusing the CustomerProfile interface (or duplicate it if needed to be self-contained)
interface CustomerProfile {
    id: string;
    fullName: string;
    companyName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    category?: string;
    businessType?: string;
    gstNumber?: string;
    tradeLicense?: string;
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
    gpsLat?: number | null;
    gpsLng?: number | null;
    ownerPhoto?: string;
    gstCertificate?: string;
    msmeCertificate?: string;
    aadharCard?: string;
    panCard?: string;
    cancelledCheque?: string;
    locationImage?: string;
}

interface EnrichedComplaint {
    id: string;
    orderId: string;
    vendorId: string;
    customerId: string;
    message: string;
    status: string;
    createdAt: Date;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerCompany: string;
}

// Minimal interface for Order display
interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    image: string | null;
}

interface OrderDetails {
    id: string;
    totalAmount: number;
    items: OrderItem[];
}

export default function ComplaintsTable({ initialComplaints }: { initialComplaints: EnrichedComplaint[] }) {
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
    const [viewOrder, setViewOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(false);

    const handleViewCustomer = async (userId: string) => {
        setLoading(true);
        const res = await getCustomerDetails(userId);
        setLoading(false);
        if (res.success && res.data) {
            setSelectedCustomer(res.data as unknown as CustomerProfile);
        } else {
            toast.error("Customer profile not found");
        }
    };

    const handleViewOrder = async (orderId: string) => {
        if (!orderId) {
            toast.error("No Order ID linked");
            return;
        }
        setLoading(true);
        const res = await getOrderDetails(orderId);
        setLoading(false);

        if (res.success && res.data) {
            // Cast response to our interface
            setViewOrder(res.data as unknown as OrderDetails);
        } else {
            toast.error("Order details not found");
        }
    };

    const DocLink = ({ url, label }: { url?: string, label: string }) => (
        url ? <a href={url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1 text-xs"><FileText className="h-3 w-3" /> {label}</a> : null
    );

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialComplaints.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No complaints found</TableCell></TableRow>
                    ) : (
                        initialComplaints.map((complaint) => (
                            <TableRow key={complaint.id}>
                                <TableCell className="text-xs text-muted-foreground">
                                    {new Date(complaint.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{complaint.orderId}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{complaint.customerName}</div>
                                    <div className="text-xs text-gray-500">{complaint.customerCompany}</div>
                                </TableCell>
                                <TableCell className="max-w-[300px] truncate" title={complaint.message}>
                                    {complaint.message}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={complaint.status === "OPEN" ? "destructive" : "secondary"}>
                                        {complaint.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => handleViewOrder(complaint.orderId)}
                                            title="View Ordered Product"
                                        >
                                            <Package className="h-4 w-4 mr-2" /> View Product
                                        </Button>
                                        <Button
                                            variant="outline" size="sm"
                                            onClick={() => handleViewCustomer(complaint.customerId)}
                                        >
                                            <User className="h-4 w-4 mr-2" /> View Customer
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* Customer Profile Modal (Reused Logic) */}
            <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Customer Details</DialogTitle>
                        <DialogDescription>Profile for {selectedCustomer?.fullName}</DialogDescription>
                    </DialogHeader>
                    {selectedCustomer && (
                        <div className="space-y-6 pt-4">
                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
                                {selectedCustomer.ownerPhoto ? (
                                    <img src={selectedCustomer.ownerPhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                        {selectedCustomer.fullName.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold">{selectedCustomer.companyName}</h3>
                                    <p className="text-sm text-gray-600">{selectedCustomer.fullName}</p>
                                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedCustomer.email}</span>
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedCustomer.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="font-bold text-sm text-blue-700 border-b pb-1">Business Details</h4>
                                    <div className="text-sm space-y-1">
                                        <p><span className="font-semibold">Type:</span> {selectedCustomer.businessType}</p>
                                        <p><span className="font-semibold">GSTIN:</span> {selectedCustomer.gstNumber}</p>
                                        <p><span className="font-semibold">Address:</span> {selectedCustomer.address}, {selectedCustomer.city}</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-bold text-sm text-green-700 border-b pb-1">Banking</h4>
                                    <div className="text-sm space-y-1">
                                        <p><span className="font-semibold">Bank:</span> {selectedCustomer.bankName}</p>
                                        <p><span className="font-semibold">Acc:</span> {selectedCustomer.accountNumber}</p>
                                        <p><span className="font-semibold">IFSC:</span> {selectedCustomer.ifscCode}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* View Product (Order Details) Modal */}
            <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Ordered Products</DialogTitle>
                        <DialogDescription>Items associated with this complaint (Order ID: {viewOrder?.id})</DialogDescription>
                    </DialogHeader>
                    {viewOrder && (
                        <div className="space-y-4 pt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {viewOrder.items.map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <div className="font-medium">{item.productName}</div>
                                            </TableCell>
                                            <TableCell className="text-right">x{item.quantity}</TableCell>
                                            <TableCell className="text-right">₹{item.price}</TableCell>
                                            <TableCell className="text-right font-bold">₹{item.price * item.quantity}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            <div className="flex justify-end pt-4 border-t">
                                <div className="text-lg font-bold">Total: ₹{viewOrder.totalAmount.toFixed(2)}</div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
