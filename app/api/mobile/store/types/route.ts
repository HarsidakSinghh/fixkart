import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
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

  const map = new Map<string, { label: string; image: string | null; count: number }>();
  for (const p of products) {
    const label =
      p.subSubCategory ||
      (p.subCategory && p.subCategory !== p.category ? p.subCategory : null) ||
      deriveType(p.name, p.title) ||
      p.category ||
      "Others";
    if (!map.has(label)) {
      map.set(label, { label, image: p.image || null, count: 1 });
    } else {
      const entry = map.get(label)!;
      entry.count += 1;
      if (!entry.image && p.image) entry.image = p.image;
    }
  }

  const types = Array.from(map.values());
  return NextResponse.json({ types });
}
