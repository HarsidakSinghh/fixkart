import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const mapped = {
    id: product.id,
    name: product.title || product.name,
    category: product.category,
    subCategory: product.subCategory,
    subSubCategory: product.subSubCategory,
    price: product.price,
    image: product.image,
    gallery: product.gallery || [],
    description: product.description || "No description provided.",
    quantity: product.quantity || 0,
    specs: product.specs || null,
    brand: product.brand || null,
  };

  return NextResponse.json({ product: mapped });
}
