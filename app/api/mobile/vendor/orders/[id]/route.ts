import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";
import { sendPushToUsers } from "@/lib/push";

function deriveOrderStatus(itemStatuses: string[]) {
  if (itemStatuses.every((status) => status === "REJECTED")) return "REJECTED";
  if (itemStatuses.some((status) => status === "DELIVERED")) return "DELIVERED";
  if (itemStatuses.some((status) => status === "SHIPPED" || status === "READY")) return "SHIPPED";
  if (itemStatuses.some((status) => status === "PROCESSING" || status === "APPROVED")) return "PROCESSING";
  return "PENDING";
}

async function handleVendorOrderAction(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const resolved = await params;
  const body = await req.json().catch(() => ({}));
  const action = String(body?.action || "").toUpperCase();

  if (!["ACCEPT", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const vendorItems = await prisma.orderItem.findMany({
    where: { orderId: resolved.id, vendorId: guard.userId },
    select: { id: true, status: true },
  });

  if (!vendorItems.length) {
    return NextResponse.json({ error: "Order not found for vendor" }, { status: 404 });
  }

  const immutableStatuses = ["SHIPPED", "DELIVERED"];
  const actionableItemIds = vendorItems
    .filter((item) => !immutableStatuses.includes(String(item.status || "").toUpperCase()))
    .map((item) => item.id);

  if (!actionableItemIds.length) {
    return NextResponse.json({ error: "Order can no longer be updated by vendor" }, { status: 409 });
  }

  const nextItemStatus = action === "ACCEPT" ? "PROCESSING" : "REJECTED";
  await prisma.orderItem.updateMany({
    where: { id: { in: actionableItemIds } },
    data: { status: nextItemStatus },
  });

  const allItems = await prisma.orderItem.findMany({
    where: { orderId: resolved.id },
    select: { status: true, vendorId: true },
  });

  const nextOrderStatus = deriveOrderStatus(
    allItems.map((item) => String(item.status || "").toUpperCase())
  );

  const updatedOrder = await prisma.order.update({
    where: { id: resolved.id },
    data: { status: nextOrderStatus },
    select: { id: true, customerId: true },
  });

  try {
    const vendorIds = Array.from(new Set(allItems.map((item) => item.vendorId).filter(Boolean)));
    const targets = [updatedOrder.customerId, ...vendorIds].filter(Boolean) as string[];
    await sendPushToUsers(
      targets,
      "Order Update",
      `Order #${updatedOrder.id.slice(-6).toUpperCase()} is now ${nextOrderStatus}`,
      { orderId: updatedOrder.id, status: nextOrderStatus }
    );
  } catch (err) {
    console.error("[push] failed to send vendor order transition", err);
  }

  return NextResponse.json({ success: true, status: nextOrderStatus });
}

export async function PATCH(
  req: Request,
  ctx: { params: { id: string } | Promise<{ id: string }> }
) {
  return handleVendorOrderAction(req, ctx);
}

export async function POST(
  req: Request,
  ctx: { params: { id: string } | Promise<{ id: string }> }
) {
  return handleVendorOrderAction(req, ctx);
}
