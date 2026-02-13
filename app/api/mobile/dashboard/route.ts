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
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

  const [vendorStats, orderStats, revenueResult, recentVendors, recentOrders, revenueOrders, commissionOrders] =
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
      prisma.order.findMany({
        where: {
          createdAt: { gte: fiveYearsAgo },
          status: { not: "REJECTED" },
        },
        select: { createdAt: true, totalAmount: true },
      }),
      prisma.order.findMany({
        where: { status: { not: "REJECTED" } },
        select: {
          items: { include: { product: true } },
        },
        take: 200,
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
  let totalCommission = 0;
  commissionOrders.forEach((order) => {
    order.items.forEach((item) => {
      const basePrice = Number(item.product?.price || 0);
      const specs: any = item.product?.specs || {};
      const commissionPercent = Number(specs.commissionPercent || 0);
      if (commissionPercent > 0) {
        totalCommission += basePrice * (commissionPercent / 100) * item.quantity;
      }
    });
  });

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

  const monthBuckets: Array<{ key: string; label: string; value: number }> = [];
  const monthMap = new Map<string, { key: string; label: string; value: number }>();
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const bucket = { key, label, value: 0 };
    monthBuckets.push(bucket);
    monthMap.set(key, bucket);
  }

  const yearBuckets: Array<{ key: string; label: string; value: number }> = [];
  const yearMap = new Map<string, { key: string; label: string; value: number }>();
  for (let i = 4; i >= 0; i--) {
    const year = new Date().getFullYear() - i;
    const key = String(year);
    const bucket = { key, label: key, value: 0 };
    yearBuckets.push(bucket);
    yearMap.set(key, bucket);
  }

  revenueOrders.forEach((order) => {
    const amount = Number(order.totalAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const createdAt = new Date(order.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;

    const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap.has(monthKey)) monthMap.get(monthKey)!.value += amount;

    const yearKey = String(createdAt.getFullYear());
    if (yearMap.has(yearKey)) yearMap.get(yearKey)!.value += amount;
  });

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
      totalCommission: Math.round(totalCommission),
    },
    revenueByDay,
    revenueSeries: {
      "7d": revenueByDay.map((d) => ({ key: d.name, label: d.name, value: d.total })),
      monthly: monthBuckets,
      yearly: yearBuckets,
    },
    recentVendors,
  });
}
