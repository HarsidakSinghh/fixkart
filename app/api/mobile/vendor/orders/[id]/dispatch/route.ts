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
  const item = await prisma.orderItem.findFirst({
    where: { id: resolved.id, vendorId: guard.userId },
    include: { order: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  }

  const normalized = String(item.status || "").toUpperCase();
  if (!["PROCESSING", "SHIPPED", "READY"].includes(normalized)) {
    return NextResponse.json(
      { error: "Accept order first before generating OTP" },
      { status: 409 }
    );
  }

  const code = item.dispatchCode || generateCode();
  await prisma.orderItem.update({
    where: { id: resolved.id },
    data: { dispatchCode: code, status: "SHIPPED" },
  });

  try {
    if (item.orderId) {
      await prisma.order.update({
        where: { id: item.orderId },
        data: { status: "SHIPPED" },
      });
    }

    if (item?.order?.customerId) {
      await sendPushToUsers(
        [item.order.customerId],
        "Order Shipped",
        `Your order item is shipped. Rider OTP: ${code}`,
        { orderId: item.orderId, status: "SHIPPED" }
      );
    }
  } catch (err) {
    console.error("[push] failed to notify customer", err);
  }

  return NextResponse.json({ success: true, code });
}
