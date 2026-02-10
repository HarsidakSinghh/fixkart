import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { requireVendor } from "@/lib/vendor-guard";
import { ObjectId } from "mongodb";

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
  const salesman = await db
    .collection("Salesman")
    .findOne({ _id: new ObjectId(salesmanId), vendorId: guard.userId });

  if (!salesman) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const logs = await db
    .collection("TrackingLog")
    .find({ salesmanId: String(salesman._id), event: "VISIT_END" })
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  return NextResponse.json({
    visits: logs.map((log) => ({
      id: String(log._id),
      createdAt: log.createdAt,
      note: log.note || "",
      customerId: log.customerId || null,
      imageUrl: log.imageUrl || null,
      companyName: log.companyName || null,
      companyAddress: log.companyAddress || null,
    })),
  });
}
