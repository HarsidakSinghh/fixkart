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

  return NextResponse.json({ complaints: res.data });
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
