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

  const specs: any = product.specs || {};
  const commissionPercent = Number(specs.commissionPercent || 0);
  const displayPrice =
    commissionPercent > 0 ? Math.round(product.price * (1 + commissionPercent / 100)) : product.price;
  const description =
    product.description ||
    specs.description ||
    specs.features ||
    specs.details ||
    null;

  const mapped = {
    id: product.id,
    name: product.title || product.name,
    category: product.category,
    subCategory: product.subCategory,
    subSubCategory: product.subSubCategory,
    price: displayPrice,
    image: product.image,
    gallery: product.gallery || [],
    description: description || "No description provided.",
    quantity: product.quantity || 0,
    specs: product.specs || null,
    brand: product.brand || null,
  };

  return NextResponse.json({ product: mapped });
}
