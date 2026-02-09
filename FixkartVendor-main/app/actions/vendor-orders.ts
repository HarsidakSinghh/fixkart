"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { sendNotification } from "@/lib/notifications";
// ❌ REMOVED: import { generateVendorInvoices } ...

export async function updateOrderStatus(itemId: string, newStatus: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    // 1. Fetch Item WITH Order Details
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { 
        order: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true
          }
        }
      } 
    });

    if (!item) throw new Error("Order item not found");

    // 2. Perform Database Updates
    await prisma.$transaction(async (tx) => {
      
      const updateData: any = { status: newStatus };

      if (newStatus === "DELIVERED") {
        updateData.deliveryDate = new Date(); 
      }

      await tx.orderItem.update({
        where: { id: itemId },
        data: updateData
      });

      // RESTOCK LOGIC
      if (newStatus === "REJECTED" || newStatus === "CANCELLED") {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity } 
          }
        });
      }
    });

    // ❌ REMOVED: Invoice Generation Logic
    // The Vendor App no longer generates invoices locally.
    // The Admin App handles generation and saves the Cloudinary URL to the DB.

    // 3. SEND NOTIFICATIONS
    if (newStatus === "SHIPPED" || newStatus === "DELIVERED") {
        const notifType = newStatus === "SHIPPED" ? "ORDER_SHIPPED" : "ORDER_DELIVERED";
        
        await sendNotification(notifType, {
            toEmail: item.order.customerEmail,
            toPhone: item.order.customerPhone,
            name: item.order.customerName || "Customer",
            orderId: item.order.id
        });
    }

    revalidatePath("/vendor/inventory");
    revalidatePath("/vendor/orders");
    
    return { success: true };

  } catch (error) {
    console.error("Update Status Error:", error);
    return { success: false, error: "Failed to update status" };
  }
}