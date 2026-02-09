"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getVendorStats() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    // 1. Fetch Completed Sales (For Revenue & Chart)
    const soldItems = await prisma.orderItem.findMany({
      where: {
        vendorId: userId,
        status: { in: ["APPROVED", "SHIPPED", "DELIVERED"] }
      },
      select: {
        price: true,
        quantity: true,
        createdAt: true
      },
      orderBy: { createdAt: "asc" }
    });

    // 2. Fetch Pending Orders Count (Action Required)
    const pendingOrders = await prisma.orderItem.count({
      where: {
        vendorId: userId,
        status: "PENDING"
      }
    });

    // 3. Fetch Inventory Count (Total Products Listed)
    const inventoryCount = await prisma.product.count({
      where: {
        vendorId: userId
      }
    });

    // 4. Fetch Returns Count
    const returns = await prisma.orderItem.count({
      where: {
        vendorId: userId,
        status: "RETURNED"
      }
    });

    // 5. Calculate Financial Totals
    const totalRevenue = soldItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalSalesCount = soldItems.reduce((acc, item) => acc + item.quantity, 0);

    // 6. Prepare Chart Data (Group by Date)
    const salesMap = new Map<string, number>();

    soldItems.forEach((item) => {
      // Safe date handling
      const dateObj = item.createdAt ? new Date(item.createdAt) : new Date();
      const dateKey = dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });
      
      const saleAmount = item.price * item.quantity;
      
      if (salesMap.has(dateKey)) {
        salesMap.set(dateKey, salesMap.get(dateKey)! + saleAmount);
      } else {
        salesMap.set(dateKey, saleAmount);
      }
    });

    const chartData = Array.from(salesMap.entries()).map(([name, sales]) => ({
      name,
      sales
    }));

    // --- RETURN ALL REQUIRED FIELDS ---
    return {
      totalRevenue,
      totalSalesCount,
      chartData,
      pendingOrders,   // <--- Now this exists!
      inventoryCount,  // <--- This too!
      returns          // <--- And this!
    };

  } catch (error) {
    console.error("Stats Error:", error);
    return null;
  }
}