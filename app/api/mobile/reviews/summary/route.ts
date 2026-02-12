import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("productIds") || "";
  const productIds = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!productIds.length) {
    return NextResponse.json({ summaries: {} });
  }

  const reviews = await prisma.productReview.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true, rating: true },
  });

  const bucket = new Map<string, { total: number; count: number }>();
  for (const row of reviews) {
    const current = bucket.get(row.productId) || { total: 0, count: 0 };
    current.total += Number(row.rating || 0);
    current.count += 1;
    bucket.set(row.productId, current);
  }

  const summaries: Record<string, { averageRating: number; reviewCount: number }> = {};
  for (const productId of productIds) {
    const value = bucket.get(productId);
    if (!value || value.count === 0) {
      summaries[productId] = { averageRating: 0, reviewCount: 0 };
      continue;
    }
    summaries[productId] = {
      averageRating: Number((value.total / value.count).toFixed(1)),
      reviewCount: value.count,
    };
  }

  return NextResponse.json({ summaries });
}
