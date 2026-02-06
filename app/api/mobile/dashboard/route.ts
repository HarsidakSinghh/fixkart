import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [vendorStats, orderStats, revenueResult, recentVendors, recentOrders] =
    await Promise.all([
      prisma.vendorProfile.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: { not: "REJECTED" } },
      }),
      prisma.vendorProfile.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          fullName: true,
          companyName: true,
          email: true,
          status: true,
          city: true,
        },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: sevenDaysAgo },
          status: { not: "REJECTED" },
        },
        select: { createdAt: true, totalAmount: true },
      }),
    ]);

  const getCount = (arr: any[], status: string) =>
    arr.find((i: any) => i.status === status)?._count.id || 0;

  const vendorApproved = getCount(vendorStats, "APPROVED");
  const vendorPending = getCount(vendorStats, "PENDING");
  const vendorSuspended = getCount(vendorStats, "SUSPENDED");
  const vendorTotal = vendorApproved + vendorPending + vendorSuspended;

  const orderPending = getCount(orderStats, "PENDING");
  const orderApproved = getCount(orderStats, "APPROVED");
  const orderCompleted = getCount(orderStats, "COMPLETED");
  const totalRevenue = revenueResult._sum.totalAmount || 0;

  const chartDataMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString("en-US", { weekday: "short" });
    chartDataMap.set(key, 0);
  }
  recentOrders.forEach((order) => {
    const key = order.createdAt.toLocaleDateString("en-US", { weekday: "short" });
    if (chartDataMap.has(key)) {
      chartDataMap.set(key, (chartDataMap.get(key) || 0) + order.totalAmount);
    }
  });

  const revenueByDay = Array.from(chartDataMap).map(([name, total]) => ({
    name,
    total,
  }));

  return NextResponse.json({
    kpis: {
      totalRevenue,
      orderPending,
      orderApproved,
      orderCompleted,
      vendorTotal,
      vendorApproved,
      vendorPending,
      vendorSuspended,
    },
    revenueByDay,
    recentVendors,
  });
}
