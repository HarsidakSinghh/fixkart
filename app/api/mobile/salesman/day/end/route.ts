import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { requireSalesman } from "@/lib/salesman-guard";

export async function POST(req: Request) {
  const guard = await requireSalesman(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json().catch(() => ({}));
  const { lat, lng } = body || {};

  const db = await getMongoDb();
  await db.collection("TrackingLog").insertOne({
    salesmanId: String(guard.salesman._id),
    event: "DAY_END",
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    createdAt: new Date(),
  });

  if (typeof lat === "number" && typeof lng === "number") {
    await db.collection("Salesman").updateOne(
      { _id: guard.salesman._id },
      {
        $set: {
          currentLat: lat,
          currentLng: lng,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        },
      }
    );
  }

  return NextResponse.json({ success: true });
}
