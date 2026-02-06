"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Define the shape of the order data we need
export type OrderDetails = {
    id: string;
    createdAt: string;
    status: string;
    totalAmount: number;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    items: {
        id: string;
        productName: string;
        quantity: number;
        price: number;
        image: string | null;
    }[];
};

export default function OrderDetailsDialog({ order }: { order: OrderDetails }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                    View Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Order #{order.id.slice(-6).toUpperCase()}
                        <Badge variant="outline">{order.status}</Badge>
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="max-h-[80vh]">
                    <div className="grid gap-4 py-4">
                        {/* Customer Info Section */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-1">Customer</h4>
                                <div className="text-sm text-muted-foreground">
                                    <p>{order.customerName}</p>
                                    <p>{order.customerEmail}</p>
                                    <p>{order.customerPhone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h4 className="font-semibold mb-1">Order Date</h4>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        {/* Order Items Section */}
                        <div>
                            <h4 className="font-semibold mb-3">Items Ordered</h4>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {/* Product Image Placeholder or Real Image */}
                                            <div className="h-12 w-12 rounded border bg-muted overflow-hidden relative">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.productName} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Img</div>
                                                )}
                                            </div>

                                            <div>
                                                <p className="font-medium text-sm">{item.productName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Qty: {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator />

                        {/* Total Section */}
                        <div className="flex items-center justify-between pt-2">
                            <span className="font-bold">Total Amount</span>
                            <span className="font-bold text-lg">
                                ₹{order.totalAmount.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}