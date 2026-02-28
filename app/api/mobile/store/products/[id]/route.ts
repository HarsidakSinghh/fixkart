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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestOrigin = new URL(req.url).origin;
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
  const imageSource = String(product.imagePath || product.image || "").trim();
  let image = normalizeMobileImageUrl(imageSource, requestOrigin);
  if (image.includes("mobile-placeholder")) {
    const hint = [
      product.subSubCategory,
      product.subCategory,
      product.category,
      product.title,
      product.name,
    ]
      .filter(Boolean)
      .join(" ");
    const inferredPath = inferCatalogPathFromText(hint);
    if (inferredPath) image = normalizeMobileImageUrl(inferredPath, requestOrigin);
  }

  const mapped = {
    id: product.id,
    name: product.title || product.name,
    category: product.category,
    subCategory: product.subCategory,
    subSubCategory: product.subSubCategory,
    price: displayPrice,
    image,
    gallery: normalizeMobileImageList(product.gallery, requestOrigin),
    description: description || "No description provided.",
    quantity: product.quantity || 0,
    specs: product.specs || null,
    brand: product.brand || null,
  };

  return NextResponse.json({ product: mapped });
}
