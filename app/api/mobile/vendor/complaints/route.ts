import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const complaints = await prisma.complaint.findMany({
    where: { vendorId: guard.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ complaints });
}
