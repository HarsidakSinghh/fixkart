"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function VendorDetailsDialog({
    open,
    onOpenChange,
    vendor,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vendor: any;
}) {
    if (!vendor) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Vendor Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 text-sm">
                    <div>
                        <Label>Store Name</Label>
                        <p>{vendor.name}</p>
                    </div>

                    <div>
                        <Label>Email</Label>
                        <p>{vendor.email}</p>
                    </div>

                    <div>
                        <Label>Phone</Label>
                        <p>{vendor.phone}</p>
                    </div>

                    <div>
                        <Label>GST Number</Label>
                        <p>{vendor.gst}</p>
                    </div>

                    <div>
                        <Label>Address</Label>
                        <p>{vendor.address}</p>
                    </div>

                    <div>
                        <Label>Joined On</Label>
                        <p>{vendor.joined}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
