"use client";

import { useState, useEffect } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { User, Tag, Calendar, Box, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";

interface InventoryItem {
    id: string;
    name: string;
    sku: string | null;
    price: number;
    stock: number;
    category: string;
    subCategory?: string | null; // Added

    // Vendor Info
    vendorId: string;
    vendorName: string;
    vendorEmail: string;
    vendorPhone: string;

    // Product Details
    description: string;
    createdAt: string;
    status: string;
    isPublished: boolean;
    image: string;
    gallery: string[];
}

export default function AllInventoryTable({ data }: { data: InventoryItem[] }) {
    const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
    const [activeImage, setActiveImage] = useState<string>("");

    // Reset active image when modal opens
    useEffect(() => {
        if (selectedProduct) {
            setActiveImage(selectedProduct.image);
        }
    }, [selectedProduct]);

    return (
        <>
            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    {/* ... (Table Header and Body remain same) ... */}
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Vendor</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No inventory found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setSelectedProduct(item)}
                                >
                                    <TableCell>
                                        <Avatar className="h-10 w-10 rounded-md border bg-gray-50">
                                            <AvatarImage src={item.image} alt={item.name} className="object-cover" />
                                            <AvatarFallback className="text-xs">IMG</AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <span className="truncate max-w-[200px]" title={item.name}>{item.name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">
                                                {item.sku || "No SKU"}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.subCategory || item.category}</TableCell>

                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-gray-900">
                                                {item.vendorName}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]" title={item.vendorId}>
                                                {item.vendorId}
                                            </span>
                                        </div>
                                    </TableCell>

                                    <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <span
                                            className={
                                                item.stock < 10 ? "text-red-500 font-bold" : "text-green-600"
                                            }
                                        >
                                            {item.stock}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {item.isPublished ? (
                                            <Badge className="bg-green-600 hover:bg-green-700">Live</Badge>
                                        ) : item.status === "APPROVED" ? (
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                                Offline
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">Pending</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- DETAILED MODAL --- */}
            <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
                <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-white gap-0">
                    <DialogTitle className="sr-only">Product Details</DialogTitle>

                    {selectedProduct && (
                        <div className="flex flex-col h-full max-h-[85vh] overflow-y-auto">

                            {/* TOP: Product Main Info */}
                            <div className="flex flex-col md:flex-row p-6 gap-6">
                                {/* Left: Image Gallery */}
                                <div className="w-full md:w-5/12 bg-gray-50 rounded-lg border flex flex-col items-center p-4 min-h-[350px]">
                                    {/* Main Image */}
                                    <div className="relative w-full aspect-square mb-4 rounded overflow-hidden border bg-white">
                                        {activeImage ? (
                                            <Image
                                                src={activeImage}
                                                alt={selectedProduct.name}
                                                fill
                                                className="object-contain"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                                        )}
                                    </div>

                                    {/* Thumbnails */}
                                    <div className="flex gap-2 overflow-x-auto w-full px-1 py-2">
                                        {[selectedProduct.image, ...selectedProduct.gallery].filter(Boolean).map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImage(img)}
                                                className={`relative w-14 h-14 flex-shrink-0 rounded border-2 overflow-hidden transition-all ${activeImage === img ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-400"
                                                    }`}
                                            >
                                                <Image src={img} alt={`thumb-${idx}`} fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Right: Details */}
                                <div className="w-full md:w-7/12 space-y-6">
                                    <div>
                                        <Badge variant="secondary" className="mb-2 uppercase tracking-wide text-[10px]">
                                            {selectedProduct.subCategory || selectedProduct.category}
                                        </Badge>
                                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                            {selectedProduct.name}
                                        </h2>
                                    </div>

                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-green-700">
                                            ₹{selectedProduct.price.toFixed(2)}
                                        </span>
                                        <span className="text-sm text-gray-500">Unit Price</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">SKU ID</span>
                                            <p className="font-mono text-sm font-semibold text-gray-900 truncate" title={selectedProduct.sku || ""}>
                                                {selectedProduct.sku || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Stock Quantity</span>
                                            <p className={`text-sm font-bold ${selectedProduct.stock > 0 ? "text-green-600" : "text-red-600"}`}>
                                                {selectedProduct.stock} Units
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Created On</span>
                                            <p className="text-sm font-medium text-gray-700">
                                                {new Date(selectedProduct.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Status</span>
                                            <div className="mt-1">
                                                {selectedProduct.isPublished ? (
                                                    <Badge className="bg-green-600">Live</Badge>
                                                ) : (
                                                    <Badge variant="outline">{selectedProduct.status}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MIDDLE: Description */}
                            <div className="px-6 pb-6">
                                <h3 className="font-bold flex items-center gap-2 mb-2 text-gray-900 text-sm">
                                    <Tag className="h-4 w-4" /> Description
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-md border text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {selectedProduct.description}
                                </div>
                            </div>

                            {/* BOTTOM: Vendor Details */}
                            <div className="bg-blue-50/30 border-t p-6">
                                <h4 className="font-bold flex items-center gap-2 mb-4 text-blue-800 text-sm uppercase tracking-wide">
                                    <User className="h-4 w-4" /> Uploaded By (Vendor Details)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Vendor Name</span>
                                        <p className="font-semibold text-gray-900 truncate" title={selectedProduct.vendorName}>
                                            {selectedProduct.vendorName}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Vendor ID</span>
                                        <p className="font-mono text-xs text-gray-600 truncate" title={selectedProduct.vendorId}>
                                            {selectedProduct.vendorId}
                                        </p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Email</span>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3 text-gray-400" />
                                            <p className="font-medium text-gray-800 text-sm truncate" title={selectedProduct.vendorEmail}>
                                                {selectedProduct.vendorEmail}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-1">Phone</span>
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-3 w-3 text-gray-400" />
                                            <p className="font-medium text-gray-800 text-sm">
                                                {selectedProduct.vendorPhone}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}