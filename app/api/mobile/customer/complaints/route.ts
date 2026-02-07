import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const complaints = await prisma.complaint.findMany({
    where: { customerId: guard.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ complaints });
}
