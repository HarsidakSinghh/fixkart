import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

export async function POST(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { productId, price, quantity } = body || {};

  if (!productId || typeof price !== "number" || typeof quantity !== "number") {
    return NextResponse.json({ error: "productId, price, quantity are required" }, { status: 400 });
  }

  const baseProduct = await prisma.product.findUnique({ where: { id: productId } });
  if (!baseProduct) {
    return NextResponse.json({ error: "Base product not found" }, { status: 404 });
  }

  const slugBase = (baseProduct.slug || baseProduct.name || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${slugBase}-${guard.userId.slice(-6)}-${Date.now()}`;

  const created = await prisma.product.create({
    data: {
      vendorId: guard.userId,
      name: baseProduct.name,
      title: baseProduct.title,
      slug,
      description: baseProduct.description,
      category: baseProduct.category,
      subCategory: baseProduct.subCategory,
      subSubCategory: baseProduct.subSubCategory,
      image: baseProduct.image,
      imagePath: baseProduct.imagePath,
      gallery: baseProduct.gallery || [],
      price,
      quantity,
      sku: baseProduct.sku ? `${baseProduct.sku}-${guard.userId.slice(-4)}` : undefined,
      specs: baseProduct.specs,
      brand: baseProduct.brand,
      status: "PENDING",
      isPublished: false,
      isFeatured: false,
    },
  });

  return NextResponse.json({ success: true, productId: created.id });
}
