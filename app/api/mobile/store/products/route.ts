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
    whereClause.AND.push({
      OR: [
      { title: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
      ],
    });
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
      price: p.price,
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
