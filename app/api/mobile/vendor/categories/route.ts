import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const categories = await prisma.product.findMany({
    where: { isPublished: true, status: "APPROVED" },
    select: { category: true },
    distinct: ["category"],
  });

  const cleaned = categories
    .map((c) => c.category)
    .filter((c) => !!c)
    .sort();

  return NextResponse.json({ categories: cleaned });
}
