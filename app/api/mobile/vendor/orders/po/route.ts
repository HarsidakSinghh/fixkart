import { NextResponse } from "next/server";
import { requireVendor } from "@/lib/vendor-guard";
import { prisma } from "@/lib/prisma";
import { generateVendorPO } from "@/lib/services/vendor-po-generator";

export async function POST(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json().catch(() => ({}));
  const { orderId } = body || {};
  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, items: { some: { vendorId: guard.userId } } },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const existing = await prisma.purchaseOrder.findFirst({
    where: { orderId, vendorId: guard.userId },
  });
  if (existing?.url) {
    return NextResponse.json({ url: existing.url });
  }

  const result = await generateVendorPO(orderId, guard.userId);
  if (!result.success || !result.url) {
    return NextResponse.json({ error: result.error || "Failed to generate PO" }, { status: 500 });
  }

  return NextResponse.json({ url: result.url });
}
