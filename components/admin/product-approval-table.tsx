"use client";

import { useState, useEffect } from "react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog, DialogContent, DialogTitle
} from "@/components/ui/dialog";
import { Check, X, Eye, FileText, User, ShoppingCart, ShieldCheck } from "lucide-react";
import { approveProduct, rejectProduct } from "@/app/admin/actions";
import { toast } from "sonner";
import Image from "next/image";

interface Product {
    id: string;
    name: string;
    category: string;
    subCategory?: string | null; // Added
    price: number;
    image: string;
    gallery: string[]; // 👈 Added gallery interface
    vendorId: string;
    createdAt: string;
    description: string;
    quantity: number;
    vendorName: string;
    vendorEmail: string;
    vendorPhone: string;
}

export default function ProductApprovalTable({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState(initialProducts);
    const [viewProduct, setViewProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null);

    // State to handle the image currently being viewed in the modal
    const [activeImage, setActiveImage] = useState<string>("");

    // Reset active image when modal opens
    useEffect(() => {
        if (viewProduct) {
            setActiveImage(viewProduct.image);
        }
    }, [viewProduct]);

    // --- HANDLERS ---
    const handleApprove = async (id: string) => {
        setIsLoading(id);
        const res = await approveProduct(id);
        setIsLoading(null);
        if (res.success) {
            toast.success("Product Approved & Live!");
            setProducts(products.filter(p => p.id !== id));
        } else {
            toast.error("Approval failed");
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm("Are you sure you want to reject/delete this product?")) return;

        setIsLoading(id);
        const res = await rejectProduct(id);
        setIsLoading(null);
        if (res.success) {
            toast.success("Product Rejected");
            setProducts(products.filter(p => p.id !== id));
        } else {
            toast.error("Rejection failed");
        }
    };

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">Image</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No pending approvals</TableCell></TableRow>
                    ) : (
                        products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    <div className="h-10 w-10 relative rounded overflow-hidden bg-gray-100 border">
                                        {product.image ? (
                                            <Image src={product.image} alt="Product" fill className="object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-xs text-gray-400">N/A</div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="truncate max-w-[200px]" title={product.name}>{product.name}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{product.subCategory || product.category}</Badge>
                                </TableCell>

                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{product.vendorName}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono">
                                            {product.vendorId.slice(-6)}...
                                        </span>
                                    </div>
                                </TableCell>

                                <TableCell>₹{product.price.toFixed(2)}</TableCell>
                                <TableCell>
                                    <span className={product.quantity > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                        {product.quantity}
                                    </span>
                                </TableCell>

                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => setViewProduct(product)}
                                            title="View Full Details"
                                        >
                                            <FileText className="h-4 w-4 mr-1" /> Details
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                            onClick={() => handleApprove(product.id)}
                                            disabled={isLoading === product.id}
                                            title="Approve"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                            onClick={() => handleReject(product.id)}
                                            disabled={isLoading === product.id}
                                            title="Reject"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {/* --- VIEW DETAILS MODAL --- */}
            <Dialog open={!!viewProduct} onOpenChange={() => setViewProduct(null)}>
                <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden bg-white gap-0">
                    <DialogTitle className="sr-only">Product Details</DialogTitle>

                    {viewProduct && (
                        <div className="h-[85vh] overflow-y-auto flex flex-col">

                            {/* TOP SECTION: Product Preview */}
                            <div className="flex flex-col md:flex-row border-b border-gray-100">

                                {/* LEFT: IMAGE GALLERY SECTION */}
                                <div className="md:w-5/12 p-6 bg-white flex flex-col items-center">
                                    {/* Main Active Image */}
                                    <div className="relative w-full aspect-square max-h-[350px] mb-4 rounded-lg overflow-hidden border border-gray-100">
                                        {activeImage ? (
                                            <Image
                                                src={activeImage}
                                                alt={viewProduct.name}
                                                fill
                                                className="object-contain"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400">No Image</div>
                                        )}
                                    </div>

                                    {/* Thumbnail Strip */}
                                    <div className="flex gap-2 overflow-x-auto w-full px-1 py-2">
                                        {/* Combine Main Image + Gallery */}
                                        {[viewProduct.image, ...viewProduct.gallery].filter(Boolean).map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImage(img)}
                                                className={`relative w-16 h-16 flex-shrink-0 rounded border-2 overflow-hidden transition-all ${activeImage === img ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-400"
                                                    }`}
                                            >
                                                <Image src={img} alt={`thumb-${idx}`} fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* RIGHT: DETAILS */}
                                <div className="md:w-7/12 p-8 flex flex-col">

                                    <div className="space-y-6">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                            {viewProduct.subCategory || viewProduct.category}
                                        </div>

                                        <h1 className="text-3xl font-bold text-[#0F1111] leading-tight">
                                            {viewProduct.name}
                                        </h1>

                                        <p className="text-sm text-gray-600 border-b pb-4">
                                            Brand: <span className="font-semibold text-blue-600">Generic</span>
                                        </p>

                                        <div className="space-y-1">
                                            <div className="flex items-baseline gap-3">
                                                <span className="text-3xl font-medium text-gray-900">
                                                    ₹{viewProduct.price.toFixed(2)}
                                                </span>
                                                <span className="text-sm text-gray-500">M.R.P.</span>
                                            </div>

                                            {viewProduct.quantity > 0 ? (
                                                <div className="text-lg text-[#007600] font-bold">In Stock</div>
                                            ) : (
                                                <div className="text-lg text-red-600 font-bold">Currently Unavailable</div>
                                            )}
                                            <p className="text-xs text-gray-500">Inclusive of all taxes</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="border rounded-md p-3 bg-gray-50/50">
                                                <span className="block text-gray-500 text-xs uppercase font-bold">Stock Count</span>
                                                <span className="font-semibold text-gray-900 text-sm">{viewProduct.quantity} Units</span>
                                            </div>
                                            <div className="border rounded-md p-3 bg-gray-50/50">
                                                <span className="block text-gray-500 text-xs uppercase font-bold">SKU</span>
                                                <span className="font-semibold text-gray-900 font-mono text-sm truncate block" title={viewProduct.id}>
                                                    {viewProduct.id.slice(-8)}
                                                </span>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-sm text-gray-900 mb-2">About this item</h3>
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {viewProduct.description || "No description provided."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BOTTOM: VENDOR DETAILS */}
                            <div className="bg-gray-50 p-8 border-t">
                                <h4 className="font-bold flex items-center gap-2 mb-4 text-blue-800 text-sm uppercase tracking-wide">
                                    <User className="h-4 w-4" /> Uploaded By (Vendor Details)
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Vendor Name</span>
                                        <p className="font-semibold text-gray-900 truncate" title={viewProduct.vendorName}>
                                            {viewProduct.vendorName}
                                        </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Vendor ID</span>
                                        <p className="font-mono text-xs text-gray-600 truncate" title={viewProduct.vendorId}>
                                            {viewProduct.vendorId}
                                        </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Email</span>
                                        <p className="font-medium text-gray-800 text-sm truncate" title={viewProduct.vendorEmail}>
                                            {viewProduct.vendorEmail}
                                        </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Phone</span>
                                        <p className="font-medium text-gray-800 text-sm">
                                            {viewProduct.vendorPhone}
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}