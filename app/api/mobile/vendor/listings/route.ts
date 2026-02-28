import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";
import { normalizeMobileImageUrl } from "@/lib/mobile-image";

export async function GET(req: Request) {
  const requestOrigin = new URL(req.url).origin;
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const products = await prisma.product.findMany({
    where: { vendorId: guard.userId },
    select: {
      id: true,
      name: true,
      title: true,
      category: true,
      subCategory: true,
      image: true,
      price: true,
      quantity: true,
      description: true,
      brand: true,
      specs: true,
      status: true,
      sku: true,
      isPublished: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const soldAgg = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { vendorId: guard.userId },
    _sum: { quantity: true },
  });

  const soldMap = new Map(
    soldAgg.map((row) => [row.productId, row._sum.quantity || 0])
  );

  const withSold = products.map((p) => ({
    ...p,
    image: normalizeMobileImageUrl(p.image, requestOrigin),
    sold: soldMap.get(p.id) || 0,
  }));
  const visibleProducts = withSold.filter((p) => {
    const specs = p?.specs;
    const deletedByVendor =
      specs && typeof specs === "object" && !Array.isArray(specs)
        ? Boolean((specs as Record<string, unknown>).deletedByVendor)
        : false;
    return !deletedByVendor;
  });

  return NextResponse.json({ products: visibleProducts });
}
