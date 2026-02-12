import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const vendorFilter = searchParams.get("vendor");
  const subCategoryFilter = searchParams.get("subcategory");

  const whereClause: Record<string, unknown> = {};

  if (vendorFilter && vendorFilter !== "all") {
    whereClause.vendorId = vendorFilter;
  }

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
    ];
  }

  if (subCategoryFilter && subCategoryFilter !== "all") {
    const subFilterCondition = {
      contains: subCategoryFilter,
      mode: "insensitive",
    };
    if (whereClause.OR) {
      whereClause.AND = [
        { OR: [{ subCategory: subFilterCondition }, { subSubCategory: subFilterCondition }] },
      ];
    } else {
      whereClause.OR = [
        { subCategory: subFilterCondition },
        { subSubCategory: subFilterCondition },
      ];
    }
  }

  whereClause.isPublished = true;
  whereClause.status = "APPROVED";

  const rawProducts = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const productVendorIds = Array.from(
    new Set(rawProducts.map((p) => p.vendorId).filter(Boolean))
  ) as string[];

  const productVendors = await prisma.vendorProfile.findMany({
    where: { userId: { in: productVendorIds } },
    select: {
      userId: true,
      companyName: true,
      fullName: true,
      email: true,
      phone: true,
    },
  });

  const vendorMap = new Map(productVendors.map((v) => [v.userId, v]));

  const inventory = rawProducts.map((p) => {
    const vendor = vendorMap.get(p.vendorId || "");
    return {
      id: p.id,
      name: p.title || p.name,
      sku: p.sku,
      price: p.price,
      stock: p.quantity,
      category: p.category,
      subCategory: p.subCategory,
      vendorId: p.vendorId || "Unknown",
      vendorName: vendor?.companyName || vendor?.fullName || "Unknown Vendor",
      vendorEmail: vendor?.email || "N/A",
      vendorPhone: vendor?.phone || "N/A",
      description: p.description || "No description provided.",
      commissionPercent: Number((p.specs as Record<string, unknown> | null)?.commissionPercent || 0),
      createdAt: p.createdAt.toISOString(),
      status: p.status,
      isPublished: p.isPublished,
      image: p.image,
      gallery: p.gallery || [],
    };
  });

  return NextResponse.json({ inventory });
}
