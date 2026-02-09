import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { requireSalesman } from "@/lib/salesman-guard";

export async function GET(req: Request) {
  const guard = await requireSalesman(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const db = await getMongoDb();
  const logs = await db
    .collection("TrackingLog")
    .find({ salesmanId: String(guard.salesman._id), event: "VISIT_END" })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  return NextResponse.json({
    visits: logs.map((log) => ({
      id: String(log._id),
      createdAt: log.createdAt,
      note: log.note || "",
      companyName: log.companyName || null,
      companyAddress: log.companyAddress || null,
      imageUrl: log.imageUrl || null,
    })),
  });
}
