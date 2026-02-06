import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const items = await prisma.orderItem.findMany({
    where: { vendorId: guard.userId },
    include: {
      order: true,
      product: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const customerIds = Array.from(
    new Set(items.map((item) => item.order?.customerId).filter(Boolean))
  ) as string[];

  const customers = customerIds.length
    ? await prisma.customerProfile.findMany({
        where: { userId: { in: customerIds } },
      })
    : [];

  const customerMap = new Map(customers.map((c) => [c.userId, c]));

  const payload = items.map((item) => {
    const order = item.order;
    const customer = order ? customerMap.get(order.customerId) : null;
    const addressParts = customer
      ? [customer.address, customer.city, customer.state, customer.postalCode].filter(Boolean)
      : [];
    return {
      id: item.id,
      orderId: item.orderId,
      status: item.status,
      dispatchCode: item.dispatchCode || null,
      quantity: item.quantity,
      price: item.price,
      productName: item.productName || item.product?.title || item.product?.name || "Product",
      image: item.image || item.product?.image || null,
      createdAt: item.createdAt.toISOString(),
      customer: {
        name: order?.customerName || customer?.fullName || "Customer",
        email: order?.customerEmail || customer?.email || "",
        phone: order?.customerPhone || customer?.phone || "",
        address: addressParts.join(", ") || "",
      },
      order: {
        status: order?.status || "PENDING",
        totalAmount: order?.totalAmount || 0,
      },
    };
  });

  return NextResponse.json({ orders: payload });
}
