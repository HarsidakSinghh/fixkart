"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { sendNotification } from "@/lib/notifications"; // <--- 1. Import Helper

// ... keep cancelOrderAction ...

// UPDATED RETURN ACTION
export async function submitReturnAction(orderId: string, reason: string) {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    // 2. Fetch Order Items AND Vendor Details (to get their email)
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
          items: { 
            include: { 
              vendor: { // <--- We need this relation
                select: { userId: true, email: true, fullName: true, phone: true } 
              } 
            } 
          } 
        }
    });

    if (!order) return { success: false, error: "Order not found" };

    // 3. Create Refund Request for each item
    const vendorsToNotify = new Map(); // Store unique vendors to notify

    for (const item of order.items) {
        // Check if request already exists to avoid duplicates
        const existing = await prisma.refundRequest.findUnique({
            where: { orderItemId: item.id }
        });

        if (!existing) {
            await prisma.refundRequest.create({
                data: {
                    orderItemId: item.id,
                    vendorId: item.vendorId,
                    customerId: userId,
                    reason: reason,
                    status: "PENDING"
                }
            });
            
            // Update Item Status
            await prisma.orderItem.update({
                where: { id: item.id },
                data: { status: "RETURN_REQUESTED" }
            });

            // Add vendor to notification list (Map handles duplicates auto)
            if (item.vendor && item.vendor.email) {
                vendorsToNotify.set(item.vendor.email, item.vendor);
            }
        }
    }

    // 4. Update Order Status
    await prisma.order.update({
        where: { id: orderId },
        data: { status: "RETURN_REQUESTED" }
    });
    
    // 5. SEND NOTIFICATIONS TO VENDORS
    for (const [email, vendor] of vendorsToNotify) {
        await sendNotification("RETURN_REQUESTED", {
            toEmail: email,
            toPhone: vendor.phone, // Kept for compatibility
            name: vendor.fullName,
            orderId: orderId,
            extraMessage: reason // Send the return reason to the vendor
        });
    }

    revalidatePath(`/orders/${orderId}`);
    return { success: true };
  } catch (e) {
    console.error("Return Error:", e);
    return { success: false, error: "Failed to request return" };
  }
}

// ... keep submitComplaintAction ...