import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  const whereClause: any = {
    status: { not: "PENDING" },
  };

  if (query) {
    whereClause.OR = [
      { id: { contains: query, mode: "insensitive" } },
      { customerName: { contains: query, mode: "insensitive" } },
      { customerEmail: { contains: query, mode: "insensitive" } },
    ];
  }

  const rawOrders = await prisma.order.findMany({
    where: whereClause,
    include: {
      purchaseOrders: true,
      vendorInvoices: true,
      items: { include: { product: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const orders = rawOrders.map((order) => ({
    id: order.id,
    customerName: order.customerName || "Unknown",
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    totalAmount: order.totalAmount,
    status: order.status,
    createdAt: order.updatedAt.toISOString(),
    invoiceUrl: order.invoiceUrl,
    customerPoUrl: order.customerPoUrl,
    purchaseOrders: order.purchaseOrders,
    vendorInvoices: order.vendorInvoices,
    items: order.items.map((item) => ({
      ...item,
      productName: item.productName || item.product?.title || "Unknown Product",
    })),
    vendorId: order.items[0]?.vendorId || "",
    expectedDelivery: order.expectedDelivery,
    userId: order.customerId,
    transportSlipUrl: order.items[0]?.transportSlipUrl,
    billUrl: order.items[0]?.billUrl,
  }));

  return NextResponse.json({ orders });
}
