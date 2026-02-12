// app/admin/actions.ts
'use server'

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { sendNotification } from "@/lib/notifications";
import { sendPushToUsers } from "@/lib/push";

// --- VENDOR ACTIONS ---
export async function updateVendorStatus(vendorId: string, newStatus: "APPROVED" | "SUSPENDED" | "REJECTED" | "PENDING") {
    try {
        const updatedVendor = await prisma.vendorProfile.update({
            where: { id: vendorId },
            data: { status: newStatus }
        })

        // --- SEND EMAIL NOTIFICATION ---
        if (newStatus === "APPROVED" && updatedVendor.email) {
            await sendNotification("VENDOR_APPROVED", {
                name: updatedVendor.fullName || updatedVendor.companyName || "Vendor",
                toEmail: updatedVendor.email,
            });
        } else if (newStatus === "REJECTED" && updatedVendor.email) {
            await sendNotification("VENDOR_REJECTED", {
                name: updatedVendor.fullName || updatedVendor.companyName || "Vendor",
                toEmail: updatedVendor.email,
                extraMessage: "Your application was not approved by the admin."
            });
        }

        // Refresh the page data automatically
        revalidatePath("/admin/onboarded-vendors")
        revalidatePath("/admin/vendors")
        return { success: true }
    } catch (error) {
        console.error("Failed to update status:", error)
        return { success: false, error: "Database update failed" }
    }
}

// --- CUSTOMER ACTIONS ---
export async function updateCustomerStatus(customerId: string, newStatus: "APPROVED" | "REJECTED" | "PENDING" | "SUSPENDED") {
    try {
        const client = await clerkClient();

        // 1. Update Database Status
        const customer = await prisma.customerProfile.update({
            where: { id: customerId },
            data: { status: newStatus } // Ensure your schema has a 'status' field on CustomerProfile!
        });

        // 2. (Optional) Sync with Clerk metadata if needed, similar to how you might handle roles
        // await client.users.updateUserMetadata(customer.userId, { publicMetadata: { status: newStatus } });

        revalidatePath("/admin/customer-approvals");
        revalidatePath("/admin/onboarded-customers");
        return { success: true };
    } catch (error) {
        console.error("Failed to update customer status:", error);
        return { success: false, error: "Database update failed" };
    }
}

// --- INVENTORY APPROVAL ACTIONS (FIXED) ---
export async function approveProduct(productId: string) {
    try {
        await prisma.product.update({
            where: { id: productId },
            data: {
                isPublished: true,   // 1. Set to TRUE so customers can see it
                status: "APPROVED"   // 2. Set status to "APPROVED" so Vendor sees it as approved
            },
        });

        // Refresh admin, vendor, and public product lists
        revalidatePath("/admin/inventory-approvals");
        revalidatePath("/admin/products");
        return { success: true };
    } catch (error) {
        console.error("Failed to approve product:", error);
        return { success: false, error: "Database update failed" };
    }
}
export async function getVendorDetails(vendorId: string) {
    if (!vendorId) {
        console.error("❌ getVendorDetails: No Vendor ID provided");
        return { success: false, error: "No Vendor ID provided" };
    }

    try {
        console.log(`🔍 [getVendorDetails] Lookup for ID: ${vendorId}`);

        // 1. Try finding by Clerk User ID first (Schema default)
        let vendor = await prisma.vendorProfile.findUnique({
            where: { userId: vendorId }
        });

        if (vendor) {
            console.log(`✅ Found by userId: ${vendor.companyName}`);
        } else {
            console.log(`⚠️ Not found by userId, trying internal ID...`);
            // 2. Fallback: Internal Mongo ID
            try {
                vendor = await prisma.vendorProfile.findUnique({
                    where: { id: vendorId }
                });
                if (vendor) console.log(`✅ Found by internal ID: ${vendor.companyName}`);
            } catch (e) {
                console.log(`❌ Invalid internal ID format: ${e}`);
            }
        }

        if (!vendor) {
            console.error(`❌ Vendor absolute failure. ID ${vendorId} not found in DB.`);
            return { success: false, error: `Vendor not found (ID: ${vendorId})` };
        }

        // 3. Map Fields
        const mappedVendor = {
            ...vendor,
            ownerPhoto: vendor.ownerPhotoUrl,
            gstCertificate: vendor.gstCertificateUrl,
            msmeCertificate: vendor.msmeCertificateUrl,
            aadharCard: vendor.aadharCardUrl,
            panCard: vendor.panCardUrl,
            cancelledCheque: vendor.cancelledChequeUrl,
            backup1IdProof: vendor.backup1IdUrl,
            backup2IdProof: vendor.backup2IdUrl,
            locationImage: vendor.locationPhotoUrl,
            gpsLat: vendor.gpsLat,
            gpsLng: vendor.gpsLng,
        };

        return { success: true, data: mappedVendor };

    } catch (error) {
        console.error("❌ Fetch Vendor Error:", error);
        return { success: false, error: `Database error: ${error}` };
    }
}
export async function getCustomerDetails(customerId: string) {
    if (!customerId) return { success: false, error: "No Customer ID provided" };

    try {
        // Try finding by Clerk User ID
        let customer = await prisma.customerProfile.findUnique({
            where: { userId: customerId }
        });

        if (!customer) {
            // Fallback to internal ID
            try {
                customer = await prisma.customerProfile.findUnique({
                    where: { id: customerId }
                });
            } catch (e) { }
        }

        if (!customer) {
            return { success: false, error: "Customer profile not found" };
        }

        // Map fields
        const mappedCustomer = {
            ...customer,
            ownerPhoto: customer.ownerPhotoUrl,
            gstCertificate: customer.gstCertificateUrl,
            msmeCertificate: customer.msmeCertificateUrl,
            aadharCard: customer.aadharCardUrl,
            panCard: customer.panCardUrl,
            cancelledCheque: customer.cancelledChequeUrl,
            locationImage: customer.locationPhotoUrl,
            backup1IdProof: customer.backup1IdUrl,
            backup2IdProof: customer.backup2IdUrl,
            gpsLat: customer.gpsLat,
            gpsLng: customer.gpsLng,
        };

        return { success: true, data: mappedCustomer };
    } catch (error) {
        console.error("Fetch Customer Error:", error);
        return { success: false, error: "Database error" };
    }
}
export async function rejectProduct(productId: string) {
    try {
        await prisma.product.delete({
            where: { id: productId },
        });

        revalidatePath("/admin/inventory-approvals");
        return { success: true };
    } catch (error) {
        console.error("Failed to reject product:", error);
        return { success: false, error: "Database update failed" };
    }
}

// --- ORDER ACTIONS ---

// 1. Basic Status Update
export async function updateOrderStatus(
    orderId: string,
    newStatus: "APPROVED" | "REJECTED" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED"
) {
    try {
        // 1. Update the Main Order (For Admin View)
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus }
        })

        // --- SUBIT NOTIFICATIONS ---
        if (newStatus === "SHIPPED" && updatedOrder.customerEmail) {
            await sendNotification("ORDER_SHIPPED", {
                name: updatedOrder.customerName || "Customer",
                toEmail: updatedOrder.customerEmail,
                orderId: updatedOrder.id
            });
        } else if (newStatus === "DELIVERED" && updatedOrder.customerEmail) {
            await sendNotification("ORDER_DELIVERED", {
                name: updatedOrder.customerName || "Customer",
                toEmail: updatedOrder.customerEmail,
                orderId: updatedOrder.id
            });
        } else if (newStatus === "APPROVED" && updatedOrder.customerEmail) {
            await sendNotification("ORDER_APPROVED", {
                name: updatedOrder.customerName || "Customer",
                toEmail: updatedOrder.customerEmail,
                orderId: updatedOrder.id
            });
        }

        // 2. SYNC: Update all associated Order Items (For Vendor View)
        // This ensures the Vendor sees the new status immediately
        await prisma.orderItem.updateMany({
            where: { orderId: orderId },
            data: { status: newStatus }
        });

        // 2.1 Push notifications to customer + vendors
        try {
            const items = await prisma.orderItem.findMany({
                where: { orderId },
                select: { vendorId: true },
            });
            const vendorIds = Array.from(new Set(items.map((i) => i.vendorId)));
            const targets = [updatedOrder.customerId, ...vendorIds].filter(Boolean) as string[];
            const title = "Order Update";
            const body = `Order #${orderId.slice(-6).toUpperCase()} is now ${newStatus}`;
            await sendPushToUsers(targets, title, body, { orderId, status: newStatus });
        } catch (err) {
            console.error("[push] failed to send order status", err);
        }

        // 3. AUTO-GENERATE PURCHASE ORDER (If Approved)
        if (newStatus === "APPROVED") {
            const { generatePurchaseOrders } = await import("@/lib/services/purchase-order-generator");
            await generatePurchaseOrders(orderId);
            console.log(`✅ Auto-generated PO for confirmed order ${orderId}`);
        }

        // 4. AUTO-GENERATE INVOICE (If Delivered)
        if (newStatus === "DELIVERED") {
            const { generateInvoice } = await import("@/lib/services/invoice-generator");
            const res = await generateInvoice(orderId);
            if (res.success) console.log(`✅ Auto-generated Invoice for delivered order ${orderId}`);
            else console.error(`❌ Failed to auto-generate invoice: ${res.error}`);
        }

        revalidatePath("/admin/orders")
        revalidatePath("/admin/orders-history")

        return { success: true }
    } catch (error) {
        console.error("Failed to update order:", error)
        return { success: false, error: "Database update failed" }
    }
}

// 2. Advanced Update (Status + Date) (Used in Order History Table)
export async function updateOrderDetails(
    orderId: string,
    data: { status?: string; deliveryDate?: string }
) {
    try {
        const updateData: any = {};

        if (data.status) {
            updateData.status = data.status;
        }

        if (data.deliveryDate) {
            updateData.expectedDelivery = new Date(data.deliveryDate);
        }

        // 1. Update the Main Order
        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData
        });

        // --- SUBIT NOTIFICATIONS ---
        if (data.status === "SHIPPED" && updatedOrder.customerEmail) {
            await sendNotification("ORDER_SHIPPED", {
                name: updatedOrder.customerName || "Customer",
                toEmail: updatedOrder.customerEmail,
                orderId: updatedOrder.id
            });
        } else if (data.status === "DELIVERED" && updatedOrder.customerEmail) {
            await sendNotification("ORDER_DELIVERED", {
                name: updatedOrder.customerName || "Customer",
                toEmail: updatedOrder.customerEmail,
                orderId: updatedOrder.id
            });
        } else if (data.status === "APPROVED" && updatedOrder.customerEmail) {
            await sendNotification("ORDER_APPROVED", {
                name: updatedOrder.customerName || "Customer",
                toEmail: updatedOrder.customerEmail,
                orderId: updatedOrder.id
            });
        }

        // 2. SYNC: If status changed, update all items for Vendors
        if (data.status) {
            await prisma.orderItem.updateMany({
                where: { orderId: orderId },
                data: { status: data.status }
            });

            // 3. AUTO-GENERATE PO (If Approved)
            if (data.status === "APPROVED") {
                const { generatePurchaseOrders } = await import("@/lib/services/purchase-order-generator");
                await generatePurchaseOrders(orderId);
                console.log(`✅ Auto-generated PO for confirmed order ${orderId} (via Details Update)`);
            }

            // 4. AUTO-GENERATE INVOICE (If Delivered)
            if (data.status === "DELIVERED") {
                const { generateInvoice } = await import("@/lib/services/invoice-generator");
                const res = await generateInvoice(orderId);
                if (res.success) console.log(`✅ Auto-generated Invoice for delivered order ${orderId} (via Details Update)`);
                else console.error(`❌ Failed to auto-generate invoice: ${res.error}`);
            }
        }

        revalidatePath("/admin/orders");
        revalidatePath("/admin/orders-history");

        return { success: true };
    } catch (error) {
        console.error("Failed to update order:", error);
        return { success: false, error: "Database update failed" };
    }
}

// --- USER ACTIONS ---
export async function toggleUserBan(userId: string, shouldBan: boolean) {
    try {
        const client = await clerkClient();

        if (shouldBan) {
            await client.users.banUser(userId);
        } else {
            await client.users.unbanUser(userId);
        }


        revalidatePath("/admin/users");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle ban status:", error);
        return { success: false, error: "Failed to update user status" };
    }
}

// --- STATS ACTIONS ---
// --- STATS ACTIONS ---
export async function getVendorStats(vendorId: string) {
    if (!vendorId) return { success: false, error: "No Vendor ID provided" };

    try {
        // 1. Resolve correct Clerk User ID
        // The UI might pass MongoDB ID, but OrderItems are linked via Clerk 'userId'
        let targetUserId = vendorId;

        // Try finding the vendor by MongoDB ID first to get the real Clerk userId
        try {
            const vendorProfile = await prisma.vendorProfile.findUnique({
                where: { id: vendorId }
            });
            if (vendorProfile) {
                targetUserId = vendorProfile.userId;
            }
        } catch (e) {
            // If failed (e.g. invalid mongo id format), assume it might be a valid clerk ID already
        }

        // 2. Fetch all order items for this vendor
        // We only count items from orders that are NOT Cancelled
        const orderItems = await prisma.orderItem.findMany({
            where: {
                vendorId: targetUserId,
                order: {
                    status: {
                        not: "CANCELLED"
                    }
                }
            },
            include: {
                order: {
                    select: { createdAt: true }
                }
            }
        });

        // 3. Calculate Totals
        const totalItemsSold = orderItems.reduce((acc, item) => acc + item.quantity, 0);
        const totalRevenue = orderItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        // 4. Prepare Chart Data (Last 6 Months)
        const chartDataMap = new Map<string, number>();
        const now = new Date();

        // Initialize last 6 months with 0
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleString('default', { month: 'short' }); // "Jan", "Feb"
            chartDataMap.set(key, 0);
        }

        orderItems.forEach(item => {
            const date = new Date(item.createdAt);
            const monthKey = date.toLocaleString('default', { month: 'short' });

            if (chartDataMap.has(monthKey)) {
                const revenue = item.price * item.quantity;
                chartDataMap.set(monthKey, (chartDataMap.get(monthKey) || 0) + revenue);
            }
        });

        const chartData = Array.from(chartDataMap.entries()).map(([name, revenue]) => ({
            name,
            revenue
        }));

        return {
            success: true,
            data: {
                totalRevenue,
                totalItemsSold,
                chartData
            }
        };

    } catch (error) {
        console.error("Failed to fetch vendor stats:", error);
        return { success: false, error: "Database error" };
    }
}

export async function getComplaints() {
    try {
        // Use findRaw to bypass potentially stale Prisma Client which might be missing the 'orderId' field
        const rawComplaints = await (prisma.complaint as any).findRaw({
            filter: {},
            options: { sort: { createdAt: -1 } }
        });

        // Map raw BSON to clean object
        const parseComplaintImages = (value: unknown): string[] => {
            if (!value) return [];
            if (Array.isArray(value)) {
                return value.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
            }
            if (typeof value !== "string" || !value.trim()) return [];
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
                }
            } catch {
                // Legacy single URL format.
            }
            return [value];
        };

        const complaints = (rawComplaints as any[]).map((raw: any) => {
            // Handle Mongo Object ID
            const id = raw._id?.$oid ? raw._id.$oid : String(raw._id);

            // Handle Date (EJSON or ISO string)
            let createdAt = new Date();
            if (raw.createdAt) {
                if (typeof raw.createdAt === 'string') createdAt = new Date(raw.createdAt);
                else if (raw.createdAt.$date) createdAt = new Date(raw.createdAt.$date);
            }

            const imageUrls = parseComplaintImages(raw.imageUrl);

            return {
                id: id,
                orderId: raw.orderId || "",
                orderItemId: raw.orderItemId || "",
                vendorId: raw.vendorId || "",
                customerId: raw.customerId || "",
                message: raw.message || "",
                imageUrl: imageUrls[0] || "",
                imageUrls,
                status: raw.status || "OPEN",
                createdAt: createdAt
            };
        });

        // Get all unique customer IDs to fetch profiles
        const customerIds = Array.from(new Set(complaints.map((c: any) => c.customerId)));

        const customers = await prisma.customerProfile.findMany({
            where: {
                userId: {
                    in: customerIds as string[]
                }
            }
        });

        // Create a map for fast lookup
        const customerMap = new Map(customers.map(c => [c.userId, c]));

        const enrichedComplaints = complaints.map((complaint: any) => {
            const customer = customerMap.get(complaint.customerId);
            return {
                ...complaint,
                customerName: customer?.fullName || "Unknown",
                customerEmail: customer?.email || "N/A",
                customerPhone: customer?.phone || "N/A",
                customerCompany: customer?.companyName || "N/A",
            };
        });

        return { success: true, data: enrichedComplaints };

    } catch (error) {
        console.error("Failed to fetch complaints:", error);
        return { success: false, error: "Database error" };
    }
}

export async function getOrderDetails(orderId: string) {
    if (!orderId) return { success: false, error: "No Order ID provided" };

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) return { success: false, error: "Order not found" };

        // Transform items to ensure productName exists
        const transformedOrder = {
            ...order,
            items: order.items.map(item => ({
                ...item,
                productName: item.productName || item.product?.title || "Unknown Product"
            }))
        };

        return { success: true, data: transformedOrder };
    } catch (error) {
        console.error("Failed to fetch order details:", error);
        return { success: false, error: "Database error" };
    }
}

// --- REFUND CHAT ACTIONS ---
import { auth } from "@clerk/nextjs/server";

export async function addRefundMessage(refundId: string, message: string) {
    try {
        const { userId } = await auth();
        // Since this is admin panel, we assume sender is Admin. 

        await prisma.refundChat.create({
            data: {
                refundRequestId: refundId,
                senderId: userId || "admin",
                senderRole: "ADMIN",
                message: message
            }
        });

        revalidatePath(`/admin/refunds/${refundId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to send message:", error);
        return { success: false, error: "Failed to send message" };
    }
}
