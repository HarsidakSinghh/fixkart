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

  const rawCustomers = await prisma.customerProfile.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
  });

  const customers = rawCustomers.map((c) => ({
    id: c.id,
    userId: c.userId,
    fullName: c.fullName,
    companyName: c.companyName,
    email: c.email,
    phone: c.phone,
    city: c.city,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({ customers });
}
