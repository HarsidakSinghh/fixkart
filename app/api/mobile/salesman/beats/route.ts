import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSalesman } from "@/lib/salesman-guard";

export async function GET(req: Request) {
  const guard = await requireSalesman(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const customers = await prisma.customerProfile.findMany({
    take: 8,
    orderBy: { updatedAt: "desc" },
  });

  const beats = customers.map((c, idx) => ({
    id: c.id,
    name: c.companyName || c.fullName,
    city: c.city,
    address: c.address,
    status: "PENDING",
    priority: idx < 3 ? "HIGH" : "MEDIUM",
  }));

  return NextResponse.json({ beats });
}
