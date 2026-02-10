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

  const grouped = new Map<string, any>();

  items.forEach((item) => {
    const order = item.order;
    if (!order) return;

    const customer = customerMap.get(order.customerId);
    const addressParts = customer
      ? [customer.address, customer.city, customer.state, customer.postalCode].filter(Boolean)
      : [];

    const productPrice = typeof item.product?.price === "number" ? item.product.price : null;
    const vendorPrice = productPrice ?? item.price;

    const existing = grouped.get(order.id);
    const entry = existing || {
      id: order.id,
      orderId: order.id,
      status: order.status || "PENDING",
      createdAt: order.createdAt.toISOString(),
      customer: {
        name: order.customerName || customer?.fullName || "Customer",
        email: order.customerEmail || customer?.email || "",
        phone: order.customerPhone || customer?.phone || "",
        address: addressParts.join(", ") || "",
      },
      items: [],
      totals: {
        vendorTotal: 0,
        totalQty: 0,
      },
    };

    entry.items.push({
      id: item.id,
      status: item.status,
      dispatchCode: item.dispatchCode || null,
      quantity: item.quantity,
      price: item.price,
      vendorPrice,
      productName: item.productName || item.product?.title || item.product?.name || "Product",
      image: item.image || item.product?.image || null,
      createdAt: item.createdAt.toISOString(),
    });

    entry.totals.vendorTotal += vendorPrice * item.quantity;
    entry.totals.totalQty += item.quantity;

    if (!existing) {
      grouped.set(order.id, entry);
    }
  });

  const payload = Array.from(grouped.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ orders: payload });
}
