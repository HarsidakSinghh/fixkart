import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

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

  return NextResponse.json({ success: true, code });
}
