import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getMongoDb } from "@/lib/mongo";

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

  const mapped = salesmen.map((s) => ({
    id: String(s._id),
    name: s.name || "Unnamed",
    phone: s.phone,
    code: s.code,
    status: s.status || "ACTIVE",
    currentLat: s.currentLat,
    currentLng: s.currentLng,
    lastUpdated: s.lastUpdated,
  }));

  return NextResponse.json({ salesmen: mapped });
}
