import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";
import type { Prisma } from "@prisma/client";

function slugify(text: string) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildSafeSku(inputSku: string, fallbackBase: string, index: number) {
  const source = String(inputSku || "").trim() || String(fallbackBase || "").trim() || "SKU";
  const normalized = source
    .toUpperCase()
    .replace(/[^A-Z0-9\-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = `${Date.now().toString(36)}-${Math.floor(Math.random() * 100000).toString(36)}-${index.toString(36)}`;
  const maxBaseLength = Math.max(1, 120 - suffix.length - 1);
  const base = (normalized || "SKU").slice(0, maxBaseLength);
  return `${base}-${suffix}`;
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

    const capped = listings.slice(0, 400);
    const prepared: Prisma.ProductCreateInput[] = [];
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
      const grade = String(row?.grade || "").trim();
      const customType = String(row?.customType || row?.type || "").trim();

      if (!name || !image || !Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { error: `Invalid listing at row ${i + 1}. Name, image and positive price are required.` },
          { status: 400 }
        );
      }

      const slugBase = slugify(name) || `item-${i + 1}`;
      const slug = `${slugBase}-${guard.userId.slice(-6)}-${Date.now()}-${i}`;
      const sku = buildSafeSku(
        String(row?.sku || ""),
        `${slugBase}-${guard.userId.slice(-4)}`,
        i
      );

      prepared.push({
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
          grade: grade || null,
          customType: customType || null,
          commissionPercent: 5,
        },
        status: "PENDING" as const,
        isPublished: false,
        isFeatured: false,
      });
    }

    const createdRows = await prisma.$transaction(
      async (tx) => {
        const rows = [];
        for (const data of prepared) {
          const created = await tx.product.create({ data });
          rows.push(created);
        }
        return rows;
      },
      {
        maxWait: 20_000,
        timeout: 240_000,
      }
    );

    return NextResponse.json({
      success: true,
      createdCount: createdRows.length,
      failedCount: 0,
      failed: [],
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit listings";
    const prismaCode = (error as { code?: string } | null)?.code;
    console.error("[bulk-submit] failed", {
      code: prismaCode,
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    if (prismaCode === "P2002") {
      return NextResponse.json(
        { error: "Duplicate listing key detected. Please retry submit once." },
        { status: 400 }
      );
    }
    if (prismaCode === "P2028") {
      return NextResponse.json(
        { error: "Bulk submit timed out. Please retry with fewer listings (e.g. 100 at a time)." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
