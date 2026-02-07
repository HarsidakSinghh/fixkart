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

  const resolvedParams = await params;
  const body = await req.json();
  const { status } = body || {};
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const complaint = await prisma.complaint.update({
    where: { id: resolvedParams.id },
    data: { status },
  });

  if (complaint?.orderItemId) {
    let nextStatus = null;
    if (status === "RESOLVED") nextStatus = "COMPLAINT_RESOLVED";
    if (status === "IN_REVIEW") nextStatus = "COMPLAINT_REVIEW";
    if (status === "OPEN") nextStatus = "COMPLAINT";
    if (nextStatus) {
      await prisma.orderItem.update({
        where: { id: complaint.orderItemId },
        data: { status: nextStatus },
      });
    }
  }

  return NextResponse.json({ success: true });
}
