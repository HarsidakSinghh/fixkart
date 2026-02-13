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
  const orderIds = Array.from(new Set(items.map((item) => item.orderId).filter(Boolean)));
  const orderItemIds = items.map((item) => item.id);
  const complaints = orderIds.length
    ? await prisma.complaint.findMany({
        where: {
          vendorId: guard.userId,
          OR: [
            { orderId: { in: orderIds } },
            { orderItemId: { in: orderItemIds } },
          ],
        },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const complaintByItemId = new Map(
    complaints
      .filter((c) => c.orderItemId)
      .map((c) => [String(c.orderItemId), c])
  );
  const complaintsByOrderId = complaints.reduce((acc, c) => {
    const key = String(c.orderId || "");
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key)?.push(c);
    return acc;
  }, new Map<string, typeof complaints>());

  type VendorOrderPayload = {
    id: string;
    orderId: string;
    status: string;
    createdAt: string;
    customer: {
      name: string;
      email: string;
      phone: string;
      address: string;
    };
    items: Array<{
      id: string;
      status: string;
      dispatchCode: string | null;
      complaintStatus: string | null;
      quantity: number;
      price: number;
      vendorPrice: number;
      productName: string;
      image: string | null;
      createdAt: string;
    }>;
    totals: {
      vendorTotal: number;
      totalQty: number;
    };
    complaints: {
      total: number;
      open: number;
      inReview: number;
      resolved: number;
      requiresAction: boolean;
      latestStatus: string | null;
    };
  };

  const grouped = new Map<string, VendorOrderPayload>();

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
      complaints: {
        total: 0,
        open: 0,
        inReview: 0,
        resolved: 0,
        requiresAction: false,
        latestStatus: null as string | null,
      },
    };

    entry.items.push({
      id: item.id,
      status: item.status,
      dispatchCode: item.dispatchCode || null,
      complaintStatus: complaintByItemId.get(item.id)?.status || null,
      quantity: item.quantity,
      price: item.price,
      vendorPrice,
      productName: item.productName || item.product?.title || item.product?.name || "Product",
      image: item.image || item.product?.image || null,
      createdAt: item.createdAt.toISOString(),
    });

    entry.totals.vendorTotal += vendorPrice * item.quantity;
    entry.totals.totalQty += item.quantity;

    const orderComplaints = complaintsByOrderId.get(order.id) || [];
    const normalizedStatuses = orderComplaints.map((c) => String(c.status || "").toUpperCase());
    entry.complaints.total = orderComplaints.length;
    entry.complaints.open = normalizedStatuses.filter((s) => s === "OPEN").length;
    entry.complaints.inReview = normalizedStatuses.filter((s) => s === "IN_REVIEW").length;
    entry.complaints.resolved = normalizedStatuses.filter((s) => s === "RESOLVED" || s === "ORDER_REJECTED").length;
    entry.complaints.requiresAction = normalizedStatuses.some((s) => s === "OPEN");
    entry.complaints.latestStatus = normalizedStatuses[0] || null;

    if (!existing) {
      grouped.set(order.id, entry);
    }
  });

  const payload = Array.from(grouped.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ orders: payload });
}
