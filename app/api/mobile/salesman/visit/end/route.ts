import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { requireSalesman } from "@/lib/salesman-guard";

export async function POST(req: Request) {
  const guard = await requireSalesman(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { customerId, outcome, note, lat, lng } = body || {};

  const db = await getMongoDb();
  await db.collection("TrackingLog").insertOne({
    salesmanId: String(guard.salesman._id),
    event: "VISIT_END",
    customerId: customerId || null,
    note: outcome ? `${outcome}${note ? ` - ${note}` : ""}` : note || null,
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}
