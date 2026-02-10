import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";
import { sendPushToUsers } from "@/lib/push";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const resolved = await params;
  const code = generateCode();

  const updated = await prisma.orderItem.updateMany({
    where: { id: resolved.id, vendorId: guard.userId },
    data: { dispatchCode: code, status: "READY" },
  });

  if (!updated.count) {
    return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  }

  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: resolved.id },
      include: { order: true },
    });
    if (item?.orderId) {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: item.orderId },
        select: { status: true },
      });
      const anyReady = orderItems.some((i) => i.status === "READY");
      if (anyReady) {
        await prisma.order.update({
          where: { id: item.orderId },
          data: { status: "SHIPPED" },
        });
      }
    }
    if (item?.order?.customerId) {
      await sendPushToUsers(
        [item.order.customerId],
        "Order Ready",
        `Your order item is ready for dispatch. Code: ${code}`,
        { orderId: item.orderId, status: "READY" }
      );
    }
  } catch (err) {
    console.error("[push] failed to notify customer", err);
  }

  return NextResponse.json({ success: true, code });
}
