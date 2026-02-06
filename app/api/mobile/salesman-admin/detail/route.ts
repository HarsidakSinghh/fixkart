import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getMongoDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const db = await getMongoDb();
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const salesman = await db.collection("Salesman").findOne({ _id: objectId });
  if (!salesman) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const logs = await db
    .collection("TrackingLog")
    .find({ salesmanId: String(salesman._id) })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const stats = {
    totalLogs: logs.length,
    visitsCompleted: logs.filter((l) => l.event === "VISIT_END").length,
    dayStarts: logs.filter((l) => l.event === "DAY_START").length,
    dayEnds: logs.filter((l) => l.event === "DAY_END").length,
  };

  return NextResponse.json({
    salesman: {
      id: String(salesman._id),
      name: salesman.name,
      phone: salesman.phone,
      code: salesman.code,
      status: salesman.status,
      currentLat: salesman.currentLat,
      currentLng: salesman.currentLng,
      lastUpdated: salesman.lastUpdated,
    },
    stats,
    logs: logs.map((l) => ({
      id: String(l._id),
      event: l.event,
      note: l.note,
      customerId: l.customerId,
      createdAt: l.createdAt,
    })),
  });
}
