import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

function parseComplaintImages(imageUrl?: string | null) {
  if (!imageUrl) return [];
  try {
    const parsed = JSON.parse(imageUrl);
    if (Array.isArray(parsed)) {
      return parsed.filter((u) => typeof u === "string" && u.trim().length > 0);
    }
  } catch {
    // Legacy single URL format
  }
  return [imageUrl];
}

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const complaintsRaw = await prisma.complaint.findMany({
    where: { vendorId: guard.userId },
    select: {
      id: true,
      orderId: true,
      orderItemId: true,
      vendorId: true,
      customerId: true,
      message: true,
      imageUrl: true,
      status: true,
      createdAt: true,
      vendorResponse: true,
      actionTaken: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const orderItemIds = Array.from(
    new Set(
      complaintsRaw
        .map((c) => (typeof c.orderItemId === "string" ? c.orderItemId : ""))
        .filter((id) => id.length > 0)
    )
  );
  const orderIds = Array.from(new Set(complaintsRaw.map((c) => c.orderId).filter(Boolean)));

  const directItems = orderItemIds.length
    ? await prisma.orderItem.findMany({
        where: { id: { in: orderItemIds } },
        include: {
          product: true,
          order: true,
        },
      })
    : [];

  const fallbackItems = orderIds.length
    ? await prisma.orderItem.findMany({
        where: {
          orderId: { in: orderIds },
          vendorId: guard.userId,
        },
        include: {
          product: true,
          order: true,
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const directItemMap = new Map(directItems.map((item) => [item.id, item]));
  const fallbackItemMap = new Map<string, (typeof fallbackItems)[number]>();
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
  for (const item of fallbackItems) {
    if (!fallbackItemMap.has(item.orderId)) {
      fallbackItemMap.set(item.orderId, item);
    }
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

  const complaints = complaintsRaw.map((c) => {
    const imageUrls = parseComplaintImages(c.imageUrl);
    const item =
      (c.orderItemId ? directItemMap.get(c.orderItemId) : undefined) || fallbackItemMap.get(c.orderId);

    return {
      ...c,
      imageUrls,
      imageUrl: imageUrls[0] || null,
      customerName: "Fixkart",
      item: item
        ? {
            id: item.id,
            productName: item.productName || item.product?.title || "Item",
            image: item.image || item.product?.image || null,
            quantity: item.quantity || 0,
            price: item.price || 0,
            status: item.status || "",
          }
        : null,
      orderItems: orderItemsMap.get(c.orderId) || [],
      order: item?.order
        ? {
            id: item.order.id,
            status: item.order.status,
            createdAt: item.order.createdAt.toISOString(),
          }
        : {
            id: c.orderId,
            status: null,
            createdAt: null,
          },
    };
  });

  return NextResponse.json({ complaints });
}
