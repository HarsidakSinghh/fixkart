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
  const assignments = await db
    .collection("SalesmanAssignment")
    .find({ vendorId: guard.userId, salesmanId })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    assignments: assignments.map((a) => ({
      id: String(a._id),
      companyName: a.companyName,
      address: a.address,
      note: a.note || "",
      status: a.status || "PENDING",
      visitDate: a.visitDate || null,
      createdAt: a.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { salesmanId, companyName, address, note, visitDate } = body || {};
  if (!salesmanId || !companyName || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = await getMongoDb();
  const salesman = await db
    .collection("Salesman")
    .findOne({ _id: new ObjectId(salesmanId), vendorId: guard.userId });

  if (!salesman) {
    return NextResponse.json({ error: "Salesman not found" }, { status: 404 });
  }

  const created = await db.collection("SalesmanAssignment").insertOne({
    vendorId: guard.userId,
    salesmanId: String(salesman._id),
    companyName,
    address,
    note: note || "",
    status: "PENDING",
    visitDate: visitDate || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return NextResponse.json({ success: true, id: String(created.insertedId) });
}
