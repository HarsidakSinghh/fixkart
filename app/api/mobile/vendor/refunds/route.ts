import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const refundsRaw = await prisma.refundRequest.findMany({
    where: { vendorId: guard.userId },
    include: {
      item: {
        include: {
          product: true,
          order: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const orderIds = Array.from(
    new Set(
      refundsRaw
        .map((r) => r.item?.orderId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const orderItems = orderIds.length
    ? await prisma.orderItem.findMany({
        where: {
          orderId: { in: orderIds },
          vendorId: guard.userId,
        },
        include: { product: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const orderItemsMap = new Map<
    string,
    Array<{
      id: string;
      productName: string;
      image: string | null;
      quantity: number;
      price: number;
      status: string;
    }>
  >();

  for (const item of orderItems) {
    if (!orderItemsMap.has(item.orderId)) {
      orderItemsMap.set(item.orderId, []);
    }
    orderItemsMap.get(item.orderId)?.push({
      id: item.id,
      productName: item.productName || item.product?.title || "Item",
      image: item.image || item.product?.image || null,
      quantity: item.quantity || 0,
      price: item.price || 0,
      status: item.status || "",
    });
  }

  const refunds = refundsRaw.map((r) => ({
    ...r,
    customerName: "Fixkart",
    item: r.item
      ? {
          id: r.item.id,
          orderId: r.item.orderId,
          productName: r.item.productName || r.item.product?.title || "Item",
          image: r.item.image || r.item.product?.image || null,
          quantity: r.item.quantity || 0,
          price: r.item.price || 0,
          status: r.item.status || "",
        }
      : null,
    order: r.item?.order
      ? {
          id: r.item.order.id,
          status: r.item.order.status,
          createdAt: r.item.order.createdAt.toISOString(),
        }
      : null,
    orderItems: r.item?.orderId ? orderItemsMap.get(r.item.orderId) || [] : [],
  }));

  return NextResponse.json({ refunds });
}
