import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getMongoDb } from "@/lib/mongo";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const db = await getMongoDb();
  const salesmen = await db
    .collection("Salesman")
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  const vendorIds = Array.from(
    new Set(salesmen.map((s) => s.vendorId).filter(Boolean))
  ) as string[];
  const vendors = vendorIds.length
    ? await prisma.vendorProfile.findMany({
        where: { userId: { in: vendorIds } },
      })
    : [];
  const vendorMap = new Map(vendors.map((v) => [v.userId, v]));

  const mapped = salesmen.map((s) => ({
    id: String(s._id),
    name: s.name || "Unnamed",
    phone: s.phone,
    code: s.code,
    status: s.status || "ACTIVE",
    currentLat: s.currentLat,
    currentLng: s.currentLng,
    lastUpdated: s.lastUpdated,
    vendorName: vendorMap.get(s.vendorId)?.companyName || vendorMap.get(s.vendorId)?.fullName || "",
    vendorId: s.vendorId || null,
    idProofUrl: s.idProofUrl || null,
  }));

  return NextResponse.json({ salesmen: mapped });
}
