import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.product.findMany({
    where: { isPublished: true, status: "APPROVED" },
    select: { category: true },
    distinct: ["category"],
  });

  const cleaned = categories.map((c) => c.category).filter(Boolean).sort();
  return NextResponse.json({ categories: cleaned });
}
