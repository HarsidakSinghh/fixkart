import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { requireSalesman } from "@/lib/salesman-guard";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireSalesman(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const db = await getMongoDb();
  const result = await db.collection("TrackingLog").deleteOne({
    _id: new ObjectId(id),
    salesmanId: String(guard.salesman._id),
  });

  return NextResponse.json({ success: result.deletedCount === 1 });
}
