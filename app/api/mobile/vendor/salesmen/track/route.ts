import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongo";
import { requireVendor } from "@/lib/vendor-guard";

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const salesmanId = searchParams.get("salesmanId");
  if (!salesmanId) {
    return NextResponse.json({ error: "Missing salesmanId" }, { status: 400 });
  }

  const db = await getMongoDb();
  const salesman = await db.collection("Salesman").findOne({
    _id: new ObjectId(salesmanId),
    vendorId: guard.userId,
  });
  if (!salesman) {
    return NextResponse.json({ error: "Salesman not found" }, { status: 404 });
  }

  const [lastStart] = await db
    .collection("TrackingLog")
    .find({ salesmanId: String(salesman._id), event: "DAY_START" })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  if (!lastStart) {
    return NextResponse.json({
      active: false,
      track: [],
      current: null,
      lastUpdated: salesman.lastUpdated || null,
    });
  }

  const [lastEnd] = await db
    .collection("TrackingLog")
    .find({
      salesmanId: String(salesman._id),
      event: "DAY_END",
      createdAt: { $gte: lastStart.createdAt },
    })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();

  const active = !lastEnd;
  const timeClause: Record<string, unknown> = { $gte: lastStart.createdAt };
  if (lastEnd?.createdAt) {
    timeClause.$lte = lastEnd.createdAt;
  }

  const logs = await db
    .collection("TrackingLog")
    .find({
      salesmanId: String(salesman._id),
      createdAt: timeClause,
      event: { $in: ["DAY_START", "GPS_PING", "DAY_END"] },
    })
    .sort({ createdAt: 1 })
    .toArray();

  const track = logs
    .filter((log) => typeof log.lat === "number" && typeof log.lng === "number")
    .map((log) => ({
      lat: log.lat,
      lng: log.lng,
      event: log.event,
      createdAt: log.createdAt,
    }));

  const current =
    typeof salesman.currentLat === "number" && typeof salesman.currentLng === "number"
      ? { lat: salesman.currentLat, lng: salesman.currentLng }
      : null;

  return NextResponse.json({
    active,
    track,
    current,
    lastUpdated: salesman.lastUpdated || null,
  });
}
