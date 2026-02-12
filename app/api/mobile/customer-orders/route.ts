import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const orders = await prisma.order.findMany({
    where: { customerId: guard.userId },
    include: {
      items: { include: { product: true, vendor: true } },
      purchaseOrders: true,
      vendorInvoices: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const payload = orders.map((order) => ({
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt.toISOString(),
    expectedDelivery: order.expectedDelivery?.toISOString() || null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || item.product?.title || item.product?.name || "Product",
      quantity: item.quantity,
      price: item.price,
      image: item.image || item.product?.image || null,
      vendorName: item.vendor?.companyName || item.vendor?.fullName || "Vendor",
      status: item.status,
    })),
  }));

  return NextResponse.json({ orders: payload });
}
