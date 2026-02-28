import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMobileImageUrl } from "@/lib/mobile-image";

function inferCatalogPathFromText(input: string) {
  const text = String(input || "").toLowerCase();
  if (text.includes("u-bolt") || text.includes("u bolt")) return "/fastening/u-bolts.jpg";
  if (text.includes("threaded")) return "/fastening/threaded-rods.jpg";
  if (text.includes("anchor")) return "/fastening/anchor.webp";
  if (text.includes("stud")) return "/fastening/studs.jpg";
  if (text.includes("screw")) return "/fastening/screws.jpg";
  if (text.includes("bolt")) return "/fastening/bolts.webp";
  return "";
}

export async function GET(req: Request) {
  const requestOrigin = new URL(req.url).origin;
  const { searchParams } = new URL(req.url);
  const subCategory = searchParams.get("subCategory") || "";
  const category = searchParams.get("category") || "";

  if (!subCategory) {
    return NextResponse.json({ error: "Missing subCategory" }, { status: 400 });
  }

  const typeCondition = { contains: subCategory, mode: "insensitive" as const };
  const categoryCondition = category
    ? {
        OR: [
          { category: { contains: category, mode: "insensitive" as const } },
          { subCategory: { contains: category, mode: "insensitive" as const } },
          { subSubCategory: { contains: category, mode: "insensitive" as const } },
        ],
      }
    : null;

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      status: "APPROVED",
      AND: [
        {
          OR: [
            { subSubCategory: typeCondition },
            { subCategory: typeCondition },
            { name: typeCondition },
            { title: typeCondition },
          ],
        },
        ...(categoryCondition ? [categoryCondition] : []),
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
    const imageSource = String(p.imagePath || p.image || "").trim();
    let image = normalizeMobileImageUrl(imageSource, requestOrigin);
    if (image.includes("mobile-placeholder")) {
      const hint = [
        p.subSubCategory,
        p.subCategory,
        p.category,
        p.title,
        p.name,
      ]
        .filter(Boolean)
        .join(" ");
      const inferredPath = inferCatalogPathFromText(hint);
      if (inferredPath) {
        image = normalizeMobileImageUrl(inferredPath, requestOrigin);
      }
    }
    return {
      id: p.id,
      name: p.title || p.name,
      category: p.category,
      subCategory: p.subCategory,
      price: displayPrice,
      image,
      quantity: p.quantity || 0,
      vendorName: vendorMap.get(p.vendorId) || "Vendor",
      specs,
      grade: String(specs?.grade || "").trim(),
      customType: String(specs?.customType || specs?.type || "").trim(),
    };
  });

  return NextResponse.json({ listings: mapped });
}
