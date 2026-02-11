import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

export async function POST(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const {
    baseProductId,
    imageUrl,
    imageUrls,
    name,
    category,
    subCategory,
    sku,
    brand,
    model,
    description,
    features,
    specs,
    price,
    mrp,
    discountedPrice,
    tieredPricing,
    hsnCode,
    stock,
    returnsPolicy,
    warrantyPolicy,
    commissionPercent,
  } = body || {};

  if (!name || !category || !price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const base = baseProductId
    ? await prisma.product.findUnique({ where: { id: baseProductId } })
    : null;
  if (baseProductId && !base) {
    return NextResponse.json({ error: "Base product not found" }, { status: 404 });
  }
  const normalizedImageUrls = Array.isArray(imageUrls)
    ? imageUrls.map((url) => String(url || "").trim()).filter(Boolean)
    : [];
  const primaryImageUrl = normalizedImageUrls[0] || imageUrl;

  if (!base && !primaryImageUrl) {
    return NextResponse.json({ error: "Missing imageUrl for listing" }, { status: 400 });
  }

  const slugBase = (base?.slug || base?.name || name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const slug = `${slugBase}-${guard.userId.slice(-6)}-${Date.now()}`;

  const combinedSpecs = {
    ...(typeof specs === "object" && specs ? specs : {}),
    features: Array.isArray(features) ? features : typeof features === "string" ? features.split(",").map((f) => f.trim()) : [],
    model: model || null,
    mrp: mrp || null,
    discountedPrice: discountedPrice || null,
    tieredPricing: tieredPricing || null,
    hsnCode: hsnCode || null,
    returnsPolicy: returnsPolicy || null,
    warrantyPolicy: warrantyPolicy || null,
    commissionPercent:
      typeof commissionPercent === "number"
        ? commissionPercent
        : typeof commissionPercent === "string"
        ? Number(commissionPercent)
        : typeof specs === "object" && specs && (specs as any).commissionPercent
        ? (specs as any).commissionPercent
        : null,
  };

  let finalSku = sku || `${base?.sku || base?.name || name}-${guard.userId.slice(-4)}-${Date.now()}`;
  // Ensure SKU uniqueness
  const existingSku = await prisma.product.findUnique({ where: { sku: finalSku } });
  if (existingSku) {
    finalSku = `${finalSku}-${Math.floor(Math.random() * 10000)}`;
  }

  const created = await prisma.product.create({
    data: {
      vendorId: guard.userId,
      name,
      title: name,
      slug,
      description: description || base?.description || null,
      category,
      subCategory,
      subSubCategory: base?.subSubCategory || null,
      image: primaryImageUrl || base?.image,
      imagePath: base?.imagePath || null,
      gallery: normalizedImageUrls.length
        ? normalizedImageUrls
        : primaryImageUrl
        ? [primaryImageUrl]
        : base?.gallery || [],
      price: Number(price),
      quantity: stock ? Number(stock) : 0,
      sku: finalSku,
      specs: combinedSpecs,
      brand: brand || base?.brand || null,
      status: "PENDING",
      isPublished: false,
      isFeatured: false,
    },
  });

  return NextResponse.json({ success: true, productId: created.id });
}
