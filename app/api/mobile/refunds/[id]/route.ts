import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { status } = body || {};
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const resolved = await params;
  await prisma.refundRequest.update({
    where: { id: resolved.id },
    data: { status },
  });

  return NextResponse.json({ success: true });
}
