"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// --- 1. GET DASHBOARD STATS ---
export async function getVendorStats() {
  const { userId } = await auth();
  if (!userId) return null;

  // Calculate Total Sales (Sum of approved/shipped/delivered items)
  const salesData = await prisma.orderItem.aggregate({
    where: {
      vendorId: userId,
      status: { in: ["APPROVED", "SHIPPED", "DELIVERED"] }
    },
    _sum: { price: true }
  });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        

  const pendingCount = await prisma.orderItem.count({
    where: { vendorId: userId, status: "PENDING" }
  });

  const approvedCount = await prisma.orderItem.count({
    where: { vendorId: userId, status: "APPROVED" }
  });

  const returnsCount = await prisma.orderItem.count({
    where: { vendorId: userId, status: "RETURNED" }
  });

  const inventoryCount = await prisma.product.count({
    where: { vendorId: userId }
  });

  return {
    totalSales: salesData._sum.price || 0,
    pendingOrders: pendingCount,
    approvedOrders: approvedCount,
    returns: returnsCount,
    inventoryCount: inventoryCount
  };
}

// --- 2. UPDATE ORDER STATUS ---
export async function updateOrderItemStatus(orderItemId: string, newStatus: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    // Verify that this item belongs to the logged-in vendor
    const item = await prisma.orderItem.findUnique({
      where: { id: orderItemId }
    });

    if (!item || item.vendorId !== userId) {
      return { success: false, error: "Item not found or unauthorized" };
    }

    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: newStatus }
    });

    revalidatePath("/vendor/orders");
    revalidatePath("/vendor/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Failed to update status" };
  }
}