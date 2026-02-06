import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Box, User, FileText, Truck, Info, Image as ImageIcon, MessageCircle, AlertTriangle } from "lucide-react";
import RefundChatSection from "@/components/admin/refund-chat-section";

export const dynamic = "force-dynamic";

export default async function RefundDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const refund = await prisma.refundRequest.findUnique({
        where: { id },
        include: {
            item: {
                include: {
                    product: true,
                    order: true,
                    vendor: true
                }
            },
            messages: {
                orderBy: {
                    createdAt: 'asc'
                }
            }
        }
    });

    if (!refund) {
        return notFound();
    }

    const item = refund.item;
    const extractUrl = (val: any): string | null => {
        if (!val) return null;
        if (typeof val === 'string') return val;
        if (Array.isArray(val) && val.length > 0) return val[0];
        return null;
    };

    const billUrl = extractUrl(item?.billUrl);
    const transportSlipUrl = extractUrl(item?.transportSlipUrl);

    // Calculate amounts
    const price = item?.price || 0;
    const quantity = item?.quantity || 0;
    const totalAmount = price * quantity;

    // Prepare messages for chat
    const allMessages = [...refund.messages];

    // Inject rejection reason as the first message if it exists
    if (refund.vendorRejectionReason) {
        allMessages.unshift({
            id: 'rejection-reason', // Virtual ID
            senderRole: 'VENDOR',
            message: refund.vendorRejectionReason,
            createdAt: refund.createdAt, // Use refund creation time or we could ideally use update time if available
            senderId: refund.vendorId, // Use vendorId as sender
            refundRequestId: refund.id
        });
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/refunds">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Refund Request Details</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>ID: {refund.id}</span>
                            <span>•</span>
                            <span>{new Date(refund.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                <Badge
                    className={`text-base px-4 py-1 ${refund.status === "APPROVED" ? "bg-green-100 text-green-800 hover:bg-green-100" :
                        refund.status === "REJECTED" ? "bg-red-100 text-red-800 hover:bg-red-100" :
                            refund.status === "DISPUTED" ? "bg-orange-100 text-orange-800 hover:bg-orange-100" :
                                "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                        }`}
                >
                    {refund.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Reason & Proof */}
                <Card className="md:col-span-2">
                    <CardHeader className="bg-gray-50/50 pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Info className="h-4 w-4" /> Customer Reason & Proof
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Reason Reported</h3>
                            <div className="bg-gray-50 border p-3 rounded-md text-sm">
                                "{refund.reason}"
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" /> Proof Images
                            </h3>
                            {refund.proofImages && refund.proofImages.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2">
                                    {refund.proofImages.map((img, idx) => (
                                        <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block relative aspect-square rounded overflow-hidden border bg-white hover:opacity-90 transition-opacity">
                                            <img src={img} alt={`Proof ${idx + 1}`} className="w-full h-full object-cover" />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic text-xs">No images uploaded.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Product Details */}
                <Card>
                    <CardHeader className="bg-gray-50/50 pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Box className="h-4 w-4" /> Product Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="flex gap-3">
                            {item?.image ? (
                                <img src={item.image} alt="Product" className="w-16 h-16 rounded border object-cover shrink-0" />
                            ) : (
                                <div className="w-16 h-16 rounded border bg-gray-100 flex items-center justify-center text-xs shrink-0">No Img</div>
                            )}
                            <div className="min-w-0">
                                <p className="font-medium text-sm line-clamp-2 leading-tight mb-1">{item?.productName || "Unknown Product"}</p>
                                <p className="text-xs text-muted-foreground">Item ID: {refund.orderItemId.slice(-6).toUpperCase()}</p>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm pt-2 border-t">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Price:</span>
                                <span>₹{price}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Quantity:</span>
                                <span>x {quantity}</span>
                            </div>
                            <div className="flex justify-between font-bold pt-2 border-t mt-2">
                                <span>Total Refund:</span>
                                <span>₹{totalAmount}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Dispute Details (Conditional) */}
                {(refund.vendorRejectionReason || refund.status === "DISPUTED" || refund.status === "REJECTED") && (
                    <Card className="md:col-span-2 lg:col-span-3 border-orange-200 bg-orange-50/10">
                        <CardHeader className="bg-orange-100/50 pb-3 border-b border-orange-100">
                            <CardTitle className="text-base font-semibold flex items-center gap-2 text-orange-800">
                                <AlertTriangle className="h-4 w-4" /> Vendor Dispute / Rejection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-semibold text-orange-900 mb-2">Rejection Reason</h3>
                                <div className="bg-white border border-orange-100 p-4 rounded-md text-orange-900 text-sm italic">
                                    "{refund.vendorRejectionReason || "No reason provided"}"
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-orange-900 mb-2">Vendor Proof</h3>
                                {refund.vendorRejectionProof && refund.vendorRejectionProof.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2">
                                        {refund.vendorRejectionProof.map((img, idx) => (
                                            <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="block relative aspect-square rounded overflow-hidden border bg-white hover:ring-2 ring-orange-400 transition-all">
                                                <img src={img} alt={`Vendor Proof ${idx + 1}`} className="w-full h-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-orange-800/60 italic text-sm">No proof provided by vendor.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 4. Chat Section */}
                <div className="md:col-span-2 lg:col-span-2">
                    <RefundChatSection refundId={refund.id} messages={allMessages} />
                </div>

                {/* 5. Details Section (Shifted to side) */}
                <div className="space-y-6">
                    {/* Entities */}
                    <Card>
                        <CardHeader className="bg-gray-50/50 pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <User className="h-4 w-4" /> Entities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs ring-2 ring-white shadow-sm">
                                        {(item?.order?.customerName?.[0] || "C").toUpperCase()}
                                    </div>
                                    <div className="text-sm overflow-hidden">
                                        <p className="font-medium truncate">{item?.order?.customerName || "Unknown"}</p>
                                        <p className="text-xs text-muted-foreground truncate">{item?.order?.customerEmail}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Vendor</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs ring-2 ring-white shadow-sm">
                                        {(item?.vendor?.companyName?.[0] || "V").toUpperCase()}
                                    </div>
                                    <div className="text-sm overflow-hidden">
                                        <p className="font-medium truncate">{item?.vendor?.companyName || "Unknown"}</p>
                                        <Link href={`/admin/vendors/${refund.vendorId}`} className="text-xs text-blue-600 hover:underline">
                                            View Profile
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Docs */}
                    <Card>
                        <CardHeader className="bg-gray-50/50 pb-3">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-dashed pb-2">
                                <span className="text-sm font-medium">Original Bill</span>
                                {billUrl ? (
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                                        <a href={billUrl} target="_blank">View</a>
                                    </Button>
                                ) : <span className="text-xs text-muted-foreground italic">Missing</span>}
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Transport Slip</span>
                                {transportSlipUrl ? (
                                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" asChild>
                                        <a href={transportSlipUrl} target="_blank">View</a>
                                    </Button>
                                ) : <span className="text-xs text-muted-foreground italic">Missing</span>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
