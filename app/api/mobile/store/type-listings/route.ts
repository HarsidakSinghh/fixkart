import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subCategory = searchParams.get("subCategory") || "";

  if (!subCategory) {
    return NextResponse.json({ error: "Missing subCategory" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      status: "APPROVED",
      OR: [
        { subSubCategory: { contains: subCategory, mode: "insensitive" } },
        { subCategory: { contains: subCategory, mode: "insensitive" } },
        { name: { contains: subCategory, mode: "insensitive" } },
        { title: { contains: subCategory, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const vendorIds = Array.from(new Set(products.map((p) => p.vendorId).filter(Boolean))) as string[];
  const vendors = vendorIds.length
    ? await prisma.vendorProfile.findMany({
        where: { userId: { in: vendorIds } },
        select: { userId: true, companyName: true, fullName: true },
      })
    : [];
  const vendorMap = new Map(vendors.map((v) => [v.userId, v.companyName || v.fullName || "Vendor"]));

  const mapped = products.map((p) => {
    const specs: any = p.specs || {};
    const commissionPercent = Number(specs.commissionPercent || 0);
    const displayPrice =
      commissionPercent > 0 ? Math.round(p.price * (1 + commissionPercent / 100)) : p.price;
    return {
      id: p.id,
      name: p.title || p.name,
      category: p.category,
      subCategory: p.subCategory,
      price: displayPrice,
      image: p.image,
      quantity: p.quantity || 0,
      vendorName: vendorMap.get(p.vendorId) || "Vendor",
    };
  });

  return NextResponse.json({ listings: mapped });
}
