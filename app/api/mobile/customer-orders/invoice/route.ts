import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-guard";
import { prisma } from "@/lib/prisma";
import { generateInvoice } from "@/lib/services/invoice-generator";

export async function POST(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json().catch(() => ({}));
  const { orderId } = body || {};
  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, customerId: guard.userId },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.invoiceUrl) {
    return NextResponse.json({ url: order.invoiceUrl });
  }

  const result = await generateInvoice(orderId);
  if (!result.success || !result.url) {
    return NextResponse.json({ error: result.error || "Failed to generate invoice" }, { status: 500 });
  }

  return NextResponse.json({ url: result.url });
}
