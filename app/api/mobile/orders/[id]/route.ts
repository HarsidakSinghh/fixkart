import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { updateOrderDetails, updateOrderStatus } from "@/app/admin/actions";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { status, deliveryDate } = body || {};

  if (!status && !deliveryDate) {
    return NextResponse.json({ error: "Missing update data" }, { status: 400 });
  }

  if (deliveryDate) {
    const resolved = await params;
    const res = await updateOrderDetails(resolved.id, {
      status,
      deliveryDate,
    });
    return NextResponse.json(res, { status: res.success ? 200 : 500 });
  }

  if (status && status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Admin can only change status to DELIVERED from SHIPPED" },
      { status: 403 }
    );
  }

  const resolved = await params;
  const order = await prisma.order.findUnique({
    where: { id: resolved.id },
    select: { status: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  let canDeliver = order.status === "SHIPPED";
  if (!canDeliver) {
    const shippedItem = await prisma.orderItem.findFirst({
      where: {
        orderId: resolved.id,
        status: { in: ["SHIPPED", "READY", "DELIVERED"] },
      },
      select: { id: true },
    });
    canDeliver = Boolean(shippedItem);
  }

  if (!canDeliver) {
    return NextResponse.json(
      { error: "Only SHIPPED orders can be marked DELIVERED by admin" },
      { status: 409 }
    );
  }

  const res = await updateOrderStatus(resolved.id, status);
  return NextResponse.json(res, { status: res.success ? 200 : 500 });
}
