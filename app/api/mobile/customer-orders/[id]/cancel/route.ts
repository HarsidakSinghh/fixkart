import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const resolved = await params;
  const orderId = resolved.id;
  const body = await req.json().catch(() => ({}));
  const reason = String(body?.reason || "").trim();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, customerId: true, status: true },
  });

  if (!order || order.customerId !== guard.userId) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const currentStatus = String(order.status || "").toUpperCase();
  if (currentStatus !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending orders can be cancelled. Please use complaint support." },
      { status: 409 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
    });

    await tx.orderItem.updateMany({
      where: {
        orderId,
        status: { in: ["PENDING", "APPROVED", "PROCESSING"] },
      },
      data: { status: "CANCELLED" },
    });

    if (reason) {
      await tx.complaint.create({
        data: {
          orderId,
          orderItemId: null,
          vendorId: "SYSTEM",
          customerId: guard.userId,
          message: `Customer cancelled pending order: ${reason}`,
          status: "RESOLVED",
          actionTaken: "CUSTOMER_CANCELLED_PENDING",
          vendorResponse: "Order cancelled by customer before approval.",
        },
      });
    }
  });

  return NextResponse.json({ success: true, status: "CANCELLED" });
}

