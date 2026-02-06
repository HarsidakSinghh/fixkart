import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { requireSalesman } from "@/lib/salesman-guard";

export async function GET(req: Request) {
  const guard = await requireSalesman(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const db = await getMongoDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const logs = await db
    .collection("TrackingLog")
    .find({ salesmanId: String(guard.salesman._id), createdAt: { $gte: today } })
    .toArray();

  const started = logs.some((l) => l.event === "DAY_START");
  const ended = logs.some((l) => l.event === "DAY_END");

  return NextResponse.json({
    status: ended ? "ENDED" : started ? "STARTED" : "NOT_STARTED",
    stats: {
      visitsPlanned: 8,
      visitsCompleted: logs.filter((l) => l.event === "VISIT_END").length,
      pendingFollowUps: 2,
      ordersBooked: 3,
      distanceCovered: "12.6 km",
    },
  });
}
