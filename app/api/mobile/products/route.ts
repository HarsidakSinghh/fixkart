import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";
import { normalizeMobileImageList, normalizeMobileImageUrl } from "@/lib/mobile-image";

export async function GET(req: Request) {
  const requestOrigin = new URL(req.url).origin;
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "APPROVED";

  const rawProducts = await prisma.product.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const products = rawProducts.map((p) => ({
    id: p.id,
    name: p.title || p.name,
    sku: p.sku,
    price: p.price,
    stock: p.quantity,
    category: p.category,
    subCategory: p.subCategory,
    vendorId: p.vendorId || "Unknown",
    description: p.description || "No description provided.",
    createdAt: p.createdAt.toISOString(),
    status: p.status,
    isPublished: p.isPublished,
    image: normalizeMobileImageUrl(p.image, requestOrigin),
    gallery: normalizeMobileImageList(p.gallery, requestOrigin),
  }));

  return NextResponse.json({ products });
}
