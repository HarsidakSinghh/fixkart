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
    whereClause.OR = [
      { category: { contains: category, mode: "insensitive" } },
      { subCategory: { contains: category, mode: "insensitive" } },
      { subSubCategory: { contains: category, mode: "insensitive" } },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      subCategory: true,
      subSubCategory: true,
      image: true,
    },
  });

  const map = new Map<string, { label: string; image: string | null; count: number }>();
  for (const p of products) {
    const label = p.subCategory || p.subSubCategory || "Others";
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
