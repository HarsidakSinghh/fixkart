import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeMobileImageUrl } from "@/lib/mobile-image";

export async function GET(req: Request) {
  const requestOrigin = new URL(req.url).origin;
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";

  const whereClause: any = {
    isPublished: true,
    status: "APPROVED",
  };

  if (category) {
    // When a top-level category is selected, only return types within it.
    whereClause.category = { contains: category, mode: "insensitive" };
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      category: true,
      subCategory: true,
      subSubCategory: true,
      name: true,
      title: true,
      image: true,
      specs: true,
    },
  });

  const toTitle = (value: string) =>
    value
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const deriveType = (name?: string | null, title?: string | null) => {
    if (name) {
      const token = name.split("-")[0]?.replace(/_/g, " ").trim();
      if (token) return toTitle(token);
    }
    if (title) {
      const token = title.split(/\s+/)[0]?.trim();
      if (token) return toTitle(token);
    }
    return null;
  };

  const map = new Map<string, { label: string; image: string | null; count: number; category: string }>();
  for (const p of products) {
    const specs =
      p?.specs && typeof p.specs === "object" && !Array.isArray(p.specs)
        ? (p.specs as Record<string, unknown>)
        : {};
    const customType = String(specs?.customType || specs?.type || "").trim();
    const label =
      customType ||
      p.subSubCategory ||
      (p.subCategory && p.subCategory !== p.category ? p.subCategory : null) ||
      deriveType(p.name, p.title) ||
      p.category ||
      "Others";
    const resolvedCategory = String(p.category || p.subCategory || "").trim();
    if (!map.has(label)) {
      const imageSource = String(p.imagePath || p.image || "").trim();
      map.set(label, {
        label,
        image: normalizeMobileImageUrl(imageSource, requestOrigin) || null,
        count: 1,
        category: resolvedCategory,
      });
    } else {
      const entry = map.get(label)!;
      entry.count += 1;
      if (!entry.image && (p.imagePath || p.image)) {
        const imageSource = String(p.imagePath || p.image || "").trim();
        entry.image = normalizeMobileImageUrl(imageSource, requestOrigin) || null;
      }
      if (!entry.category && resolvedCategory) entry.category = resolvedCategory;
    }
  }

  const types = Array.from(map.values());
  return NextResponse.json({ types });
}
