import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ productId: string; reviewId: string }> }
) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { productId, reviewId } = await params;
  const body = await req.json();
  const reply = String(body?.reply || "").trim();
  if (!reply) {
    return NextResponse.json({ error: "Reply is required" }, { status: 400 });
  }

  const review = await prisma.productReview.findUnique({
    where: { id: reviewId },
    select: { id: true, productId: true },
  });
  if (!review || review.productId !== productId) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  await prisma.productReview.update({
    where: { id: reviewId },
    data: {
      adminReply: reply,
      adminRepliedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true });
}
