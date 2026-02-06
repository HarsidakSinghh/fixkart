import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const resolved = await params;
  const body = await req.json();
  const { price, quantity } = body || {};

  if (typeof price !== "number" && typeof quantity !== "number") {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: resolved.id, vendorId: guard.userId },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const nextData: any = {};
  if (typeof price === "number") {
    nextData.price = price;
    if (price !== product.price) {
      nextData.status = "PENDING";
      nextData.isPublished = false;
    }
  }
  if (typeof quantity === "number") {
    nextData.quantity = quantity;
  }

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: nextData,
  });

  return NextResponse.json({ success: true, product: updated });
}
