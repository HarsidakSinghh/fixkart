import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  const rawVendors = await prisma.vendorProfile.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
  });

  const vendors = rawVendors.map((v) => ({
    id: v.id,
    userId: v.userId,
    fullName: v.fullName,
    companyName: v.companyName,
    email: v.email,
    phone: v.phone,
    city: v.city,
    status: v.status,
    createdAt: v.createdAt.toISOString(),
  }));

  return NextResponse.json({ vendors });
}
