import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      status: "APPROVED",
      ...(category ? { category } : {}),
    },
    select: {
      id: true,
      name: true,
      title: true,
      category: true,
      subCategory: true,
      image: true,
      price: true,
      sku: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ products });
}
