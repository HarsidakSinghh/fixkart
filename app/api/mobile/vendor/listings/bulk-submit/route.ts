import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

function slugify(text: string) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function ensureUniqueSku(baseSku: string) {
  const candidate = String(baseSku || "").trim();
  if (!candidate) {
    return `SKU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }
  const existing = await prisma.product.findUnique({ where: { sku: candidate } });
  if (!existing) return candidate;
  return `${candidate}-${Math.floor(Math.random() * 10000)}`;
}

export async function POST(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const listings = Array.isArray(body?.listings) ? body.listings : [];
    if (!listings.length) {
      return NextResponse.json({ error: "No listings to submit" }, { status: 400 });
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: guard.userId },
      select: { companyName: true, fullName: true },
    });
    const fallbackBrand = vendor?.companyName || vendor?.fullName || null;

    const createdIds: string[] = [];
    const failed: Array<{ index: number; reason: string }> = [];

    const capped = listings.slice(0, 400);
    for (let i = 0; i < capped.length; i += 1) {
      const row = capped[i] || {};
      const name = String(row?.name || "").trim();
      const category = String(row?.category || "").trim() || "Fastening & Joining";
      const subCategory = String(row?.subCategory || "").trim() || "";
      const image = String(row?.image || "").trim();
      const price = Number(row?.price || 0);
      const stock = Number(row?.stock ?? 0);
      const brand = String(row?.brand || fallbackBrand || "").trim() || null;
      const description = String(row?.description || "").trim() || null;
      const cartonPieces = Number(row?.cartonPieces || 0);
      const size = String(row?.size || "").trim();

      if (!name || !image || !Number.isFinite(price) || price <= 0) {
        failed.push({ index: i, reason: "Missing required fields" });
        continue;
      }

      const slug = `${slugify(name)}-${guard.userId.slice(-6)}-${Date.now()}-${i}`;
      const rawSku = String(row?.sku || `${slugify(name)}-${guard.userId.slice(-4)}`).toUpperCase();
      const sku = await ensureUniqueSku(rawSku);
      try {
        const created = await prisma.product.create({
          data: {
            vendorId: guard.userId,
            name,
            title: name,
            slug,
            description,
            category,
            subCategory,
            image,
            gallery: [image],
            price,
            quantity: Number.isFinite(stock) && stock >= 0 ? Math.floor(stock) : 0,
            sku,
            brand,
            specs: {
              cartonPieces: Number.isFinite(cartonPieces) && cartonPieces > 0 ? Math.floor(cartonPieces) : null,
              size: size || null,
              commissionPercent: 5,
            },
            status: "PENDING",
            isPublished: false,
            isFeatured: false,
          },
        });
        createdIds.push(created.id);
      } catch (error: unknown) {
        const reason = error instanceof Error ? error.message : "Create failed";
        failed.push({ index: i, reason });
      }
    }

    return NextResponse.json({
      success: true,
      createdCount: createdIds.length,
      failedCount: failed.length,
      failed,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit listings";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
