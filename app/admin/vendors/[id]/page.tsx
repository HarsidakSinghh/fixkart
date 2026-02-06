import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, MapPin, ExternalLink, User, Building, CreditCard, Phone, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VendorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // 1. Await params
    const { id } = await params;

    // 2. Fetch Vendor
    const vendor = await prisma.vendorProfile.findUnique({
        where: { id: id },
    });

    if (!vendor) {
        return notFound();
    }

    // Helper to render Document Links
    const DocRow = ({ label, url }: { label: string, url?: string | null }) => (
        <div className="flex justify-between items-center border-b pb-2 last:border-0">
            <span className="font-medium text-sm text-gray-600">{label}</span>
            {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium">
                    <FileText className="h-3 w-3" /> View <ExternalLink className="h-3 w-3" />
                </a>
            ) : (
                <span className="text-muted-foreground text-xs italic">Not Uploaded</span>
            )}
        </div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4">
            {/* --- Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-center gap-4">
                    {/* Owner Photo */}
                    {vendor.ownerPhotoUrl ? (
                        <img src={vendor.ownerPhotoUrl} alt="Owner" className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-400">
                            {vendor.fullName.charAt(0)}
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{vendor.companyName || vendor.fullName}</h1>
                        <p className="text-muted-foreground">{vendor.email} • {vendor.phone}</p>
                        <p className="text-xs text-gray-500 mt-1">ID: {vendor.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Badge
                        variant={vendor.status === "APPROVED" ? "default" : vendor.status === "SUSPENDED" ? "destructive" : "secondary"}
                        className="text-base px-4 py-1"
                    >
                        {vendor.status}
                    </Badge>
                    <Button variant="outline" asChild>
                        <Link href="/admin/onboarded-vendors">Back to List</Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. BUSINESS INFO */}
                <Card>
                    <CardHeader className="pb-3 bg-gray-50/50">
                        <CardTitle className="text-base font-semibold text-blue-700 flex items-center gap-2">
                            <Building className="h-4 w-4" /> Business Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">Company Name:</span>
                            <span className="text-sm">{vendor.companyName || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">Business Type:</span>
                            <span className="text-sm">{vendor.businessType || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">Years in Business:</span>
                            <span className="text-sm">{vendor.yearsInBusiness || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">GST Number:</span>
                            <span className="text-sm font-mono">{vendor.gstNumber || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">Trade License:</span>
                            <span className="text-sm">{vendor.tradeLicense || "N/A"}</span>
                        </div>
                        <div className="space-y-1 pt-1">
                            <span className="font-semibold text-sm block">Registered Address:</span>
                            <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded border">
                                {vendor.address}<br />
                                {vendor.city}, {vendor.state} - {vendor.postalCode}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. IDENTITY VERIFICATION (Updated to show Aadhar/PAN) */}
                <Card>
                    <CardHeader className="pb-3 bg-gray-50/50">
                        <CardTitle className="text-base font-semibold text-indigo-700 flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Identity Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">Full Name:</span>
                            <span className="text-sm">{vendor.fullName}</span>
                        </div>

                        <div className="space-y-3 mt-2">
                            {/* Aadhar Card Display */}
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Aadhar Card</span>
                                {vendor.aadharCardUrl ? (
                                    <a href={vendor.aadharCardUrl} target="_blank" className="block w-full h-24 rounded-md border overflow-hidden hover:opacity-90 transition bg-gray-50 flex items-center justify-center relative group">
                                        <img src={vendor.aadharCardUrl} alt="Aadhar" className="max-w-full max-h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-bold">View Full</div>
                                    </a>
                                ) : (
                                    <span className="text-xs text-red-500 italic">Not Uploaded</span>
                                )}
                            </div>

                            {/* PAN Card Display */}
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase block mb-1">PAN Card</span>
                                {vendor.panCardUrl ? (
                                    <a href={vendor.panCardUrl} target="_blank" className="block w-full h-24 rounded-md border overflow-hidden hover:opacity-90 transition bg-gray-50 flex items-center justify-center relative group">
                                        <img src={vendor.panCardUrl} alt="PAN" className="max-w-full max-h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-white text-xs font-bold">View Full</div>
                                    </a>
                                ) : (
                                    <span className="text-xs text-red-500 italic">Not Uploaded</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. BANKING DETAILS */}
                <Card>
                    <CardHeader className="pb-3 bg-gray-50/50">
                        <CardTitle className="text-base font-semibold text-green-700 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" /> Banking Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">Bank Name:</span>
                            <span className="text-sm">{vendor.bankName}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">Account Holder:</span>
                            <span className="text-sm">{vendor.accountHolder}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">Account Number:</span>
                            <span className="text-sm font-mono">{vendor.accountNumber}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="font-semibold text-sm">IFSC Code:</span>
                            <span className="text-sm font-mono">{vendor.ifscCode}</span>
                        </div>
                        {vendor.cancelledChequeUrl && (
                            <div className="pt-2">
                                <span className="font-semibold text-sm block mb-1">Cancelled Cheque:</span>
                                <a href={vendor.cancelledChequeUrl} target="_blank" className="block w-full h-32 rounded-md border overflow-hidden hover:opacity-90 transition bg-gray-50 flex items-center justify-center">
                                    <img src={vendor.cancelledChequeUrl} alt="Cheque" className="max-w-full max-h-full object-contain" />
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 4. LOCATION & GPS */}
                <Card>
                    <CardHeader className="pb-3 bg-gray-50/50">
                        <CardTitle className="text-base font-semibold text-red-700 flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Location Verification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        {vendor.locationPhotoUrl ? (
                            <div className="relative w-full h-40 rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center">
                                <img src={vendor.locationPhotoUrl} alt="Shop Location" className="max-w-full max-h-full object-contain" />
                            </div>
                        ) : (
                            <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                                No Shop Image
                            </div>
                        )}

                        <div className="flex items-center justify-between border-t pt-3">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">GPS Coordinates</p>
                                <p className="text-sm font-mono">{vendor.gpsLat ?? "N/A"}, {vendor.gpsLng ?? "N/A"}</p>
                            </div>
                            {vendor.gpsLat && vendor.gpsLng && (
                                <Button size="sm" variant="outline" className="gap-2 h-8" asChild>
                                    <a href={`https://www.google.com/maps/search/?api=1&query=$${vendor.gpsLat},${vendor.gpsLng}`} target="_blank">
                                        <MapPin className="h-3 w-3" /> Maps
                                    </a>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 5. BACKUP CONTACTS */}
                <Card>
                    <CardHeader className="pb-3 bg-gray-50/50">
                        <CardTitle className="text-base font-semibold text-orange-700 flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Backup Contacts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="bg-orange-50 p-3 rounded-md border border-orange-100">
                            <p className="text-xs font-bold text-orange-800 uppercase mb-1">Contact Person 1</p>
                            <p className="text-sm font-semibold">{vendor.backup1Name || "N/A"}</p>
                            <p className="text-sm text-gray-600">{vendor.backup1Phone || "N/A"}</p>
                            {vendor.backup1IdUrl && (
                                <a href={vendor.backup1IdUrl} target="_blank" className="text-xs text-blue-600 hover:underline mt-1 block">View ID Proof</a>
                            )}
                        </div>

                        <div className="bg-orange-50 p-3 rounded-md border border-orange-100">
                            <p className="text-xs font-bold text-orange-800 uppercase mb-1">Contact Person 2</p>
                            <p className="text-sm font-semibold">{vendor.backup2Name || "N/A"}</p>
                            <p className="text-sm text-gray-600">{vendor.backup2Phone || "N/A"}</p>
                            {vendor.backup2IdUrl && (
                                <a href={vendor.backup2IdUrl} target="_blank" className="text-xs text-blue-600 hover:underline mt-1 block">View ID Proof</a>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 6. DOCUMENTS REPOSITORY */}
                <Card className="md:col-span-2 lg:col-span-3">
                    <CardHeader className="pb-3 bg-gray-50/50">
                        <CardTitle className="text-base font-semibold text-purple-700 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Uploaded Documents Repository
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                            <DocRow label="Aadhar Card" url={vendor.aadharCardUrl} />
                            <DocRow label="PAN Card" url={vendor.panCardUrl} />
                            <DocRow label="GST Certificate" url={vendor.gstCertificateUrl} />
                            <DocRow label="MSME Certificate" url={vendor.msmeCertificateUrl} />
                            <DocRow label="Cancelled Cheque" url={vendor.cancelledChequeUrl} />
                            <DocRow label="Shop/Location Photo" url={vendor.locationPhotoUrl} />
                            <DocRow label="Owner Photo" url={vendor.ownerPhotoUrl} />
                            <DocRow label="Backup Contact 1 ID" url={vendor.backup1IdUrl} />
                            <DocRow label="Backup Contact 2 ID" url={vendor.backup2IdUrl} />
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
