import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMobileImageList, normalizeMobileImageUrl } from "@/lib/mobile-image";

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
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";
  const subCategory = searchParams.get("subCategory") || "";

  const whereClause: any = {
    isPublished: true,
    status: "APPROVED",
    AND: [],
  };

  if (query) {
    const tokens = query
      .trim()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    for (const token of tokens) {
      whereClause.AND.push({
        OR: [
          { title: { contains: token, mode: "insensitive" } },
          { name: { contains: token, mode: "insensitive" } },
          { sku: { contains: token, mode: "insensitive" } },
          { brand: { contains: token, mode: "insensitive" } },
          { category: { contains: token, mode: "insensitive" } },
          { subCategory: { contains: token, mode: "insensitive" } },
          { subSubCategory: { contains: token, mode: "insensitive" } },
        ],
      });
    }
  }

  if (category) {
    whereClause.AND.push({
      OR: [
      { category: { contains: category, mode: "insensitive" } },
      { subCategory: { contains: category, mode: "insensitive" } },
      { subSubCategory: { contains: category, mode: "insensitive" } },
      ],
    });
  }

  if (subCategory) {
    whereClause.AND.push({
      subCategory: { contains: subCategory, mode: "insensitive" },
    });
  }

  if (!whereClause.AND.length) {
    delete whereClause.AND;
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

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
      if (inferredPath) image = normalizeMobileImageUrl(inferredPath, requestOrigin);
    }
    const description =
      p.description ||
      specs.description ||
      specs.features ||
      specs.details ||
      null;
    return {
      id: p.id,
      name: p.title || p.name,
      category: p.category,
      subCategory: p.subCategory,
      subSubCategory: p.subSubCategory,
      price: displayPrice,
      image,
      gallery: normalizeMobileImageList(p.gallery, requestOrigin),
      description: description || "No description provided.",
      quantity: p.quantity || 0,
      specs: p.specs || null,
      brand: p.brand || null,
    };
  });

  return NextResponse.json({ products: mapped });
}
