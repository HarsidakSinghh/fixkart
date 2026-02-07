import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";

export async function POST(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { orderItemId, reason, imageUrl } = body || {};

  if (!orderItemId || !reason) {
    return NextResponse.json({ error: "Missing orderItemId or reason" }, { status: 400 });
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
  });
  if (!item) {
    return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  }

  const existing = await prisma.refundRequest.findUnique({
    where: { orderItemId },
  });
  if (existing) {
    return NextResponse.json({ error: "Refund already requested" }, { status: 409 });
  }

  const created = await prisma.$transaction(async (tx) => {
    const refund = await tx.refundRequest.create({
      data: {
        orderItemId,
        vendorId: item.vendorId,
        customerId: guard.userId,
        reason,
        status: "PENDING",
        proofImages: imageUrl ? [imageUrl] : [],
      },
    });

    await tx.orderItem.update({
      where: { id: orderItemId },
      data: { status: "REFUND_REQUESTED" },
    });

    return refund;
  });

  return NextResponse.json({ success: true, refundId: created.id });
}
