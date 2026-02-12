import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { requireCustomer } from "@/lib/customer-guard";
import { getComplaints } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const res = await getComplaints();
  if (!res.success) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }

  const complaints = Array.isArray(res.data) ? res.data : [];
  const orderIds = Array.from(
    new Set(
      complaints
        .map((c) => (typeof c?.orderId === "string" ? c.orderId : ""))
        .filter((id) => id.length > 0)
    )
  );

  const orders = orderIds.length
    ? await prisma.order.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          paymentMethod: true,
          createdAt: true,
          customerPhone: true,
          billingAddress: true,
        },
      })
    : [];
  const orderMap = new Map(orders.map((o) => [o.id, o]));

  const enriched = complaints.map((c) => {
    const order = orderMap.get(String(c.orderId || ""));
    return {
      ...c,
      orderStatus: order?.status || "",
      orderTotalAmount: Number(order?.totalAmount || 0),
      orderPaymentMethod: order?.paymentMethod || "",
      orderCreatedAt: order?.createdAt ? order.createdAt.toISOString() : null,
      orderCustomerPhone: order?.customerPhone || "",
      orderBillingAddress: order?.billingAddress || "",
    };
  });

  return NextResponse.json({ complaints: enriched });
}

export async function POST(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { orderId, orderItemId, message, imageUrl, imageUrls } = body || {};

  if (!orderId || !message) {
    return NextResponse.json({ error: "Missing orderId or message" }, { status: 400 });
  }

  let vendorId: string | null = null;
  if (orderItemId) {
    const item = await prisma.orderItem.findUnique({ where: { id: orderItemId } });
    vendorId = item?.vendorId || null;
  }

  if (!vendorId) {
    const firstItem = await prisma.orderItem.findFirst({
      where: { orderId },
      select: { vendorId: true },
    });
    vendorId = firstItem?.vendorId || null;
  }

  if (!vendorId) {
    return NextResponse.json({ error: "Unable to resolve vendor" }, { status: 400 });
  }

  const normalizedImageUrls = Array.isArray(imageUrls)
    ? imageUrls.filter((u: unknown) => typeof u === "string" && u.trim().length > 0)
    : typeof imageUrl === "string" && imageUrl.trim()
    ? [imageUrl.trim()]
    : [];
  const storedImageUrl = normalizedImageUrls.length ? JSON.stringify(normalizedImageUrls) : null;

  const complaint = await prisma.$transaction(async (tx) => {
    const created = await tx.complaint.create({
      data: {
        orderId,
        orderItemId: orderItemId || null,
        vendorId,
        customerId: guard.userId,
        message,
        imageUrl: storedImageUrl,
        status: "OPEN",
      },
    });

    if (orderItemId) {
      await tx.orderItem.update({
        where: { id: orderItemId },
        data: { status: "COMPLAINT" },
      });
    }

    return created;
  });

  return NextResponse.json({ success: true, complaintId: complaint.id });
}
