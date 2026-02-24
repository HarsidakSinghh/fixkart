import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { approveProduct, rejectProduct } from "@/app/admin/actions";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  const body = await req.json();
  const { action, comment } = body || {};
  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  if (action === "SEND_REVIEW") {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { specs: true },
    });
    const currentSpecs =
      existing?.specs && typeof existing.specs === "object" && !Array.isArray(existing.specs)
        ? (existing.specs as Record<string, unknown>)
        : {};

    await prisma.product.update({
      where: { id },
      data: {
        status: "PENDING",
        isPublished: false,
        specs: {
          ...currentSpecs,
          adminNeedsReview: true,
          adminReviewNote: String(comment || "").trim(),
          adminReviewAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  }

  const res = action === "APPROVE" ? await approveProduct(id) : await rejectProduct(id);
  return NextResponse.json(res, { status: res.success ? 200 : 500 });
}
