import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";
  const category = searchParams.get("category") || "";

  const whereClause: any = {
    isPublished: true,
    status: "APPROVED",
  };

  if (query) {
    whereClause.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
      { sku: { contains: query, mode: "insensitive" } },
    ];
  }

  if (category) {
    whereClause.OR = [
      { category: { contains: category, mode: "insensitive" } },
      { subCategory: { contains: category, mode: "insensitive" } },
      { subSubCategory: { contains: category, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const mapped = products.map((p) => ({
    id: p.id,
    name: p.title || p.name,
    category: p.category,
    subCategory: p.subCategory,
    subSubCategory: p.subSubCategory,
    price: p.price,
    image: p.image,
    gallery: p.gallery || [],
    description: p.description || "No description provided.",
    quantity: p.quantity || 0,
  }));

  return NextResponse.json({ products: mapped });
}
