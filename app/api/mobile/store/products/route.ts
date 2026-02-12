import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
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
      image: p.image,
      gallery: p.gallery || [],
      description: description || "No description provided.",
      quantity: p.quantity || 0,
      specs: p.specs || null,
      brand: p.brand || null,
    };
  });

  return NextResponse.json({ products: mapped });
}
