"use client";

import { useState } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    User, Store, Loader2, FileText, MapPin, CreditCard, Phone, Building, Package, Mail, Eye, Printer, Download, ScrollText, ChevronDown, ClipboardList, Receipt
} from "lucide-react";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { updateOrderDetails, getVendorDetails, getCustomerDetails } from "@/app/admin/actions";
import { toast } from "sonner";
import Link from "next/link";

// --- INTERFACES ---
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
    backup1Name?: string;
    backup1Phone?: string;
    backup2Name?: string;
    backup2Phone?: string;
    gpsLat?: number | null;
    gpsLng?: number | null;
    ownerPhoto?: string;
    gstCertificate?: string;
    msmeCertificate?: string;
    aadharCard?: string;
    panCard?: string;
    cancelledCheque?: string;
    locationImage?: string;
    backup1IdProof?: string;
    backup2IdProof?: string;
}

interface VendorProfile {
    id: string;
    fullName: string;
    companyName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    status: string;
    gstNumber?: string;
    tradeLicense?: string;
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    ifscCode?: string;
    backup1Name?: string;
    backup1Phone?: string;
    backup2Name?: string;
    backup2Phone?: string;
    gpsLat?: string | number | null;
    gpsLng?: string | number | null;
    locationImage?: string;
    ownerPhoto?: string;
    gstCertificate?: string;
    msmeCertificate?: string;
    aadharCard?: string;
    panCard?: string;
    cancelledCheque?: string;
    backup1IdProof?: string;
    backup2IdProof?: string;
}

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    status: string;
}

interface PurchaseOrder {
    id: string;
    url: string;
    vendorId: string;
}

interface VendorInvoice {
    id: string;
    url: string;
    vendorId: string;
}

interface Order {
    id: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    totalAmount: number;
    status: string;
    createdAt: string;
    vendorId: string;
    items: OrderItem[];
    expectedDelivery?: string | Date | null;
    userId?: string;
    invoiceUrl?: string | null;
    customerPoUrl?: string | null; // [NEW]
    purchaseOrders?: PurchaseOrder[];
    vendorInvoices?: VendorInvoice[]; // [NEW]
}

export default function OrderHistoryTable({ initialOrders }: { initialOrders: Order[] }) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<CustomerProfile | null>(null);
    const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
    const [viewOrder, setViewOrder] = useState<Order | null>(null);
    const [viewOrderVendor, setViewOrderVendor] = useState<VendorProfile | null>(null);
    const [loadingData, setLoadingData] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [loadingPoId, setLoadingPoId] = useState<string | null>(null);
    const [loadingCustomerPoId, setLoadingCustomerPoId] = useState<string | null>(null);
    const [loadingVendorInvId, setLoadingVendorInvId] = useState<string | null>(null); // [NEW] // [NEW]

    // --- HANDLERS ---
    const handleViewCustomer = async (userId?: string) => {
        if (!userId) {
            toast.error("No Customer ID linked to this order");
            return;
        }
        setLoadingData(true);
        const res = await getCustomerDetails(userId);
        setLoadingData(false);
        if (res.success && res.data) {
            setSelectedCustomerProfile(res.data as unknown as CustomerProfile);
        } else {
            toast.error("Customer profile not found");
        }
    };

    const handleViewVendorStandalone = async (vendorId: string) => {
        if (!vendorId) {
            toast.error("No Vendor ID linked to this order");
            return;
        }
        setLoadingData(true);
        const res = await getVendorDetails(vendorId);
        setLoadingData(false);
        if (res.success) setSelectedVendor(res.data as unknown as VendorProfile);
        else toast.error(res.error || "Could not fetch vendor details");
    };

    const handleViewDetails = async (order: Order) => {
        setViewOrder(order);
        setViewOrderVendor(null);
        const res = await getVendorDetails(order.vendorId);
        if (res.success) setViewOrderVendor(res.data as unknown as VendorProfile);
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setLoadingId(orderId);
        const res = await updateOrderDetails(orderId, { status: newStatus });
        setLoadingId(null);
        if (res.success) toast.success(`Status updated to ${newStatus}`);
        else toast.error("Failed to update status");
    };

    const handleDateChange = async (orderId: string, dateString: string) => {
        if (!dateString) return;
        const res = await updateOrderDetails(orderId, { deliveryDate: dateString });
        if (res.success) toast.success("Delivery date updated");
        else toast.error("Failed to update date");
    };

    const handleGenerateInvoice = async (orderId: string) => {
        setLoadingId(orderId);
        try {
            const response = await fetch("/api/invoices/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const data = await response.json();

            if (data.success && data.url) {
                toast.success("Invoice generated successfully");
                setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, invoiceUrl: data.url } : o));
            } else {
                toast.error(data.error || "Failed to generate invoice");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        } finally {
            setLoadingId(null);
        }
    };

    // [NEW] Handle PO Generation
    const handleGeneratePO = async (orderId: string) => {
        setLoadingPoId(orderId);
        try {
            const response = await fetch("/api/purchase-orders/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success(`Generated ${data.count} Purchase Order(s)`);
                window.location.reload();
            } else {
                toast.error(data.error || "Failed to generate POs");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        } finally {
            setLoadingPoId(null);
        }
    };

    // [NEW] Handle Customer PO Generation
    const handleGenerateCustomerPO = async (orderId: string) => {
        setLoadingCustomerPoId(orderId);
        try {
            const response = await fetch("/api/customer-purchase-orders/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const data = await response.json();

            if (data.success && data.url) {
                toast.success("Customer PO generated successfully");
                setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, customerPoUrl: data.url } : o));
            } else {
                toast.error(data.error || "Failed to generate Customer PO");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        } finally {
            setLoadingCustomerPoId(null);
        }
    };

    // [NEW] Handle Vendor Invoice Generation
    const handleGenerateVendorInvoice = async (orderId: string) => {
        setLoadingVendorInvId(orderId);
        try {
            const response = await fetch("/api/vendor-invoices/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const data = await response.json();

            if (data.success) {
                toast.success(`Generated ${data.count} Vendor Invoice(s)`);
                window.location.reload();
            } else {
                toast.error(data.error || "Failed to generate Vendor Invoices");
            }
        } catch (error) {
            toast.error("Error connecting to server");
        } finally {
            setLoadingVendorInvId(null);
        }
    };

    const DocLink = ({ url, label }: { url?: string, label: string }) => (
        url ? <a href={url} target="_blank" className="text-blue-600 hover:underline flex items-center gap-1 text-xs"><FileText className="h-3 w-3" /> {label}</a> : null
    );

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                {/* ... (Existing Table Header) ... */}
                <TableHeader>
                    <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[160px]">Admin Status</TableHead>
                        <TableHead className="w-[140px]">Vendor Status</TableHead>
                        <TableHead className="w-[160px]">Estimated Delivery</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-right">Ordered On</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No order history found</TableCell></TableRow>
                    ) : (
                        orders.map((order) => {
                            // ... (Existing vendor status logic) ...
                            const vendorStatus = order.items[0]?.status || "PENDING";
                            let statusColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
                            if (vendorStatus === "APPROVED") statusColor = "bg-green-100 text-green-800 border-green-200";
                            if (vendorStatus === "REJECTED") statusColor = "bg-red-100 text-red-800 border-red-200";
                            if (vendorStatus === "SHIPPED") statusColor = "bg-blue-100 text-blue-800 border-blue-200";

                            return (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{order.id.slice(-6).toUpperCase()}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{order.customerName}</div>
                                        <div className="text-xs text-muted-foreground">{order.customerEmail || "No email"}</div>
                                    </TableCell>
                                    <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Select defaultValue={order.status} onValueChange={(val) => handleStatusChange(order.id, val)} disabled={loadingId === order.id}>
                                            <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="APPROVED">Approved</SelectItem>
                                                <SelectItem value="SHIPPED">Shipped</SelectItem>
                                                <SelectItem value="DELIVERED">Delivered</SelectItem>
                                                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`shadow-none font-normal ${statusColor} hover:${statusColor}`}>
                                            {vendorStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Input type="date" className="h-8 w-[140px] text-xs" defaultValue={order.expectedDelivery ? new Date(order.expectedDelivery).toISOString().split('T')[0] : ""} onChange={(e) => handleDateChange(order.id, e.target.value)} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            {/* Details Buttons */}
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-blue-600 border-blue-200 bg-blue-50/50" onClick={() => handleViewCustomer(order.userId || order.id)} title="View Customer Profile">
                                                <User className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-purple-600 border-purple-200 bg-purple-50/50" onClick={() => handleViewVendorStandalone(order.vendorId)} title="View Vendor">
                                                {loadingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-8 w-8 text-gray-700 border-gray-300 bg-gray-100 hover:bg-gray-200" onClick={() => handleViewDetails(order)} title="View Full Order Details">
                                                <Eye className="h-4 w-4" />
                                            </Button>

                                            {/* --- INVOICE BUTTON --- */}
                                            {order.invoiceUrl ? (
                                                <a href={order.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="icon" className="h-8 w-8 text-green-600 border-green-200 bg-green-50/50" title="Download Invoice">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </a>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 text-orange-600 border-orange-200 bg-orange-50/50"
                                                    onClick={() => handleGenerateInvoice(order.id)}
                                                    disabled={loadingId === order.id}
                                                    title="Generate Invoice"
                                                >
                                                    {loadingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                                                </Button>
                                            )}

                                            {/* --- CUSTOMER PO BUTTON (NEW) --- */}
                                            {order.customerPoUrl ? (
                                                <a href={order.customerPoUrl} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="icon" className="h-8 w-8 text-pink-600 border-pink-200 bg-pink-50/50" title="Download Customer PO">
                                                        <ClipboardList className="h-4 w-4" />
                                                    </Button>
                                                </a>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 text-pink-600 border-pink-200 bg-pink-50/50"
                                                    onClick={() => handleGenerateCustomerPO(order.id)}
                                                    disabled={loadingCustomerPoId === order.id}
                                                    title="Generate Customer PO"
                                                >
                                                    {loadingCustomerPoId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                                                </Button>
                                            )}
                                            {/* --- PURCHASE ORDER BUTTON (NEW) --- */}
                                            {order.purchaseOrders && order.purchaseOrders.length > 0 ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="icon" className="h-8 w-8 text-indigo-600 border-indigo-200 bg-indigo-50/50" title="Download Purchase Order(s)">
                                                            <ScrollText className="h-4 w-4" />
                                                            {/* <ChevronDown className="h-3 w-3 ml-1" /> */}
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {order.purchaseOrders.map((po, idx) => (
                                                            <DropdownMenuItem key={po.id} asChild>
                                                                <a href={po.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                                                    <Download className="h-3 w-3" /> PO {idx + 1} ({po.vendorId ? "Vendor" : "General"})
                                                                </a>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 text-indigo-600 border-indigo-200 bg-indigo-50/50"
                                                    onClick={() => handleGeneratePO(order.id)}
                                                    disabled={loadingPoId === order.id}
                                                    title="Generate Purchase Order"
                                                >
                                                </Button>
                                            )}

                                            {/* --- VENDOR INVOICE BUTTON (NEW) --- */}
                                            {order.vendorInvoices && order.vendorInvoices.length > 0 ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="icon" className="h-8 w-8 text-teal-600 border-teal-200 bg-teal-50/50" title="Download Vendor Invoice(s)">
                                                            <Receipt className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {order.vendorInvoices.map((inv, idx) => (
                                                            <DropdownMenuItem key={inv.id} asChild>
                                                                <a href={inv.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                                                                    <Download className="h-3 w-3" /> Invoice {idx + 1} ({inv.vendorId ? "Vendor" : "General"})
                                                                </a>
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 text-teal-600 border-teal-200 bg-teal-50/50"
                                                    onClick={() => handleGenerateVendorInvoice(order.id)}
                                                    disabled={loadingVendorInvId === order.id}
                                                    title="Generate Vendor Invoice"
                                                >
                                                    {loadingVendorInvId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
                                                </Button>
                                            )}



                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            {/* --- 1. CUSTOMER PROFILE MODAL --- */}
            <Dialog open={!!selectedCustomerProfile} onOpenChange={() => setSelectedCustomerProfile(null)}>
                <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Customer Profile</DialogTitle>
                        <DialogDescription>Full details for {selectedCustomerProfile?.fullName}</DialogDescription>
                    </DialogHeader>
                    {selectedCustomerProfile && (
                        <div className="space-y-6 pt-4">
                            {/* Header */}
                            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border">
                                {selectedCustomerProfile.ownerPhoto ? (
                                    <img src={selectedCustomerProfile.ownerPhoto} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                        {selectedCustomerProfile.fullName.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{selectedCustomerProfile.companyName}</h3>
                                    <p className="text-sm text-gray-600">{selectedCustomerProfile.fullName}</p>
                                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedCustomerProfile.email}</span>
                                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {selectedCustomerProfile.phone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Business Info */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-sm text-blue-700 border-b pb-1">Business Details</h4>
                                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                                        <span className="text-gray-500">Type:</span> <span className="font-medium">{selectedCustomerProfile.businessType || "N/A"}</span>
                                        <span className="text-gray-500">Category:</span> <span className="font-medium">{selectedCustomerProfile.category || "N/A"}</span>
                                        <span className="text-gray-500">GSTIN:</span> <span className="font-medium">{selectedCustomerProfile.gstNumber || "N/A"}</span>
                                        <span className="text-gray-500">License:</span> <span className="font-medium">{selectedCustomerProfile.tradeLicense || "N/A"}</span>
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-sm text-orange-700 border-b pb-1">Location</h4>
                                    <p className="text-sm text-gray-700">{selectedCustomerProfile.address}</p>
                                    <p className="text-sm text-gray-700">{selectedCustomerProfile.city}, {selectedCustomerProfile.state} - {selectedCustomerProfile.postalCode}</p>
                                    {selectedCustomerProfile.gpsLat && (
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${selectedCustomerProfile.gpsLat},${selectedCustomerProfile.gpsLng}`} target="_blank" className="text-blue-600 hover:underline text-xs flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3" /> View on Maps
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Banking */}
                            <div className="bg-green-50 p-4 rounded border border-green-100">
                                <h4 className="font-bold text-sm text-green-800 mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Banking Information</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div><span className="block text-xs text-green-600">Bank</span>{selectedCustomerProfile.bankName}</div>
                                    <div><span className="block text-xs text-green-600">Account No</span>{selectedCustomerProfile.accountNumber}</div>
                                    <div><span className="block text-xs text-green-600">IFSC</span>{selectedCustomerProfile.ifscCode}</div>
                                    <div><span className="block text-xs text-green-600">Holder</span>{selectedCustomerProfile.accountHolder}</div>
                                </div>
                            </div>

                            {/* Documents */}
                            <div>
                                <h4 className="font-bold text-sm text-gray-700 border-b pb-1 mb-3">Uploaded Documents</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <DocLink label="GST Cert" url={selectedCustomerProfile.gstCertificate} />
                                    <DocLink label="MSME Cert" url={selectedCustomerProfile.msmeCertificate} />
                                    <DocLink label="Aadhar" url={selectedCustomerProfile.aadharCard} />
                                    <DocLink label="PAN" url={selectedCustomerProfile.panCard} />
                                    <DocLink label="Cheque" url={selectedCustomerProfile.cancelledCheque} />
                                    <DocLink label="Shop Photo" url={selectedCustomerProfile.locationImage} />
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* --- 2. VENDOR MODAL (FULL LAYOUT REQUESTED) --- */}
            <Dialog open={!!selectedVendor} onOpenChange={() => setSelectedVendor(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Vendor Profile</span>
                            {selectedVendor && (
                                <Badge variant={selectedVendor.status === "APPROVED" ? "default" : "destructive"}>
                                    {selectedVendor.status}
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription>Full registration details.</DialogDescription>
                    </DialogHeader>

                    {selectedVendor && (
                        <div className="space-y-6 text-sm">
                            {/* 1. Basic Info Header */}
                            <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-lg">
                                {selectedVendor.ownerPhoto ? (
                                    <img src={selectedVendor.ownerPhoto} alt="Owner" className="w-16 h-16 rounded-full object-cover border" />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center"><User /></div>
                                )}
                                <div>
                                    <h3 className="text-lg font-bold">{selectedVendor.companyName}</h3>
                                    <p className="text-gray-600">Owner: {selectedVendor.fullName}</p>
                                    <p className="text-gray-500 text-xs">{selectedVendor.email} • {selectedVendor.phone}</p>
                                </div>
                            </div>

                            {/* 2. Business & Banking Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold flex items-center gap-2 mb-2 text-blue-700">
                                        <Building className="h-4 w-4" /> Business Details
                                    </h4>
                                    <div className="space-y-2 border-l-2 border-blue-100 pl-3">
                                        <p><span className="font-semibold">GSTIN:</span> {selectedVendor.gstNumber || "N/A"}</p>
                                        <p><span className="font-semibold">Trade License:</span> {selectedVendor.tradeLicense || "N/A"}</p>
                                        <p><span className="font-semibold">Address:</span> {selectedVendor.address}</p>
                                        <p>{selectedVendor.city}, {selectedVendor.state} - {selectedVendor.postalCode}</p>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold flex items-center gap-2 mb-2 text-green-700">
                                        <CreditCard className="h-4 w-4" /> Banking Details
                                    </h4>
                                    <div className="space-y-2 border-l-2 border-green-100 pl-3">
                                        <p><span className="font-semibold">Bank:</span> {selectedVendor.bankName}</p>
                                        <p><span className="font-semibold">Holder:</span> {selectedVendor.accountHolder}</p>
                                        <p><span className="font-semibold">Acc No:</span> {selectedVendor.accountNumber}</p>
                                        <p><span className="font-semibold">IFSC:</span> {selectedVendor.ifscCode}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Backup Contacts */}
                            <div>
                                <h4 className="font-bold flex items-center gap-2 mb-2 text-orange-700">
                                    <Phone className="h-4 w-4" /> Backup Contacts
                                </h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-orange-50 p-3 rounded">
                                        <p className="font-semibold text-xs text-orange-800 uppercase">Contact 1</p>
                                        <p>{selectedVendor.backup1Name || "N/A"}</p>
                                        <p className="text-gray-500">{selectedVendor.backup1Phone}</p>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded">
                                        <p className="font-semibold text-xs text-orange-800 uppercase">Contact 2</p>
                                        <p>{selectedVendor.backup2Name || "N/A"}</p>
                                        <p className="text-gray-500">{selectedVendor.backup2Phone}</p>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Documents Section */}
                            <div>
                                <h4 className="font-bold flex items-center gap-2 mb-2 text-purple-700">
                                    <FileText className="h-4 w-4" /> Uploaded Documents
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    <DocLink label="GST Cert" url={selectedVendor.gstCertificate} />
                                    <DocLink label="MSME Cert" url={selectedVendor.msmeCertificate} />
                                    <DocLink label="Aadhar Card" url={selectedVendor.aadharCard} />
                                    <DocLink label="PAN Card" url={selectedVendor.panCard} />
                                    <DocLink label="Cancelled Cheque" url={selectedVendor.cancelledCheque} />
                                    <DocLink label="Backup 1 ID" url={selectedVendor.backup1IdProof} />
                                    <DocLink label="Backup 2 ID" url={selectedVendor.backup2IdProof} />
                                </div>
                            </div>

                            {/* 5. Location Section */}
                            <div>
                                <h4 className="font-bold flex items-center gap-2 mb-2 text-red-700">
                                    <MapPin className="h-4 w-4" /> Location Verification
                                </h4>
                                <div className="flex gap-4 items-start">
                                    {selectedVendor.locationImage && (
                                        <img src={selectedVendor.locationImage} alt="Shop" className="w-32 h-24 object-cover rounded border" />
                                    )}
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500">GPS Coordinates captured during registration:</p>
                                        {selectedVendor.gpsLat ? (
                                            <Link href={`https://www.google.com/maps/search/?api=1&query=${selectedVendor.gpsLat},${selectedVendor.gpsLng}`} target="_blank" className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-xs">
                                                <MapPin className="h-3 w-3" /> View on Google Maps
                                            </Link>
                                        ) : (
                                            <span className="text-gray-400 italic">No GPS data available</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* --- 3. FULL ORDER DETAILS MODAL (Keep as is) --- */}
            <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-gray-50/50 p-0 gap-0">
                    <DialogHeader className="p-6 bg-white border-b">
                        <DialogTitle className="text-xl font-bold">Order Details</DialogTitle>
                    </DialogHeader>
                    {/* (Content hidden for brevity - kept same as before) */}
                    {viewOrder && (
                        <div className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                    <h4 className="font-bold flex items-center gap-2 mb-3 text-gray-700"><User className="h-4 w-4" /> Customer Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{viewOrder.customerName}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium">{viewOrder.customerEmail}</span></div>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-lg border shadow-sm">
                                    <h4 className="font-bold flex items-center gap-2 mb-3 text-gray-700"><Package className="h-4 w-4" /> Order Summary</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-gray-500">Total Items</span><span className="font-medium">{viewOrder.items.length}</span></div>
                                        <div className="flex justify-between pt-2"><span className="font-bold">Total</span><span className="font-bold text-green-700">₹{viewOrder.totalAmount.toFixed(2)}</span></div>
                                    </div>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b font-semibold text-sm text-gray-700">Order Items</div>
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
                                                <TableCell className="font-medium">{item.productName}</TableCell>
                                                <TableCell className="text-right">x{item.quantity}</TableCell>
                                                <TableCell className="text-right">₹{item.price}</TableCell>
                                                <TableCell className="text-right font-bold">₹{item.price * item.quantity}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
