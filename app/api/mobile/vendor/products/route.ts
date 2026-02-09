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
  const subCategory = searchParams.get("subCategory") || undefined;
  const query = searchParams.get("query") || undefined;
  const includeAll = searchParams.get("all") === "1";

  const whereClause: any = {};
  if (!includeAll) {
    whereClause.isPublished = true;
    whereClause.status = "APPROVED";
  }
  if (category) {
    whereClause.category = category;
  }
  if (query) {
    const needle = { contains: query, mode: "insensitive" };
    whereClause.OR = [
      ...(whereClause.OR || []),
      { name: needle },
      { title: needle },
      { subCategory: needle },
      { subSubCategory: needle },
    ];
  }
  if (subCategory) {
    whereClause.OR = [
      ...(whereClause.OR || []),
      { subSubCategory: { contains: subCategory, mode: "insensitive" } },
      { subCategory: { contains: subCategory, mode: "insensitive" } },
      { name: { contains: subCategory, mode: "insensitive" } },
      { title: { contains: subCategory, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      title: true,
      category: true,
      subCategory: true,
      subSubCategory: true,
      image: true,
      price: true,
      sku: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });

  return NextResponse.json({ products });
}
