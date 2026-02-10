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
  const parsedLat = typeof lat === "number" ? lat : null;
  const parsedLng = typeof lng === "number" ? lng : null;

  const db = await getMongoDb();
  await db.collection("TrackingLog").insertOne({
    salesmanId: String(guard.salesman._id),
    event: "GPS_PING",
    lat: parsedLat,
    lng: parsedLng,
    createdAt: new Date(),
  });

  if (typeof parsedLat === "number" && typeof parsedLng === "number") {
    await db.collection("Salesman").updateOne(
      { _id: guard.salesman._id },
      {
        $set: {
          currentLat: parsedLat,
          currentLng: parsedLng,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        },
      }
    );
  }

  return NextResponse.json({ success: true });
}
