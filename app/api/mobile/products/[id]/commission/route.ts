import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;
  const body = await req.json();
  const rawValue = Number(body?.commissionPercent);

  if (!Number.isFinite(rawValue) || rawValue < 0 || rawValue > 100) {
    return NextResponse.json({ error: "commissionPercent must be between 0 and 100" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: { specs: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const currentSpecs =
    product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
      ? (product.specs as Record<string, unknown>)
      : {};

  const nextCommission = Number(rawValue.toFixed(2));
  const updated = await prisma.product.update({
    where: { id },
    data: {
      specs: {
        ...currentSpecs,
        commissionPercent: nextCommission,
      },
    },
    select: {
      id: true,
      specs: true,
    },
  });

  return NextResponse.json({
    success: true,
    id: updated.id,
    commissionPercent: Number(
      (
        updated.specs &&
        typeof updated.specs === "object" &&
        !Array.isArray(updated.specs) &&
        "commissionPercent" in (updated.specs as Record<string, unknown>)
          ? (updated.specs as Record<string, unknown>).commissionPercent
          : 0
      ) || 0
    ),
  });
}
