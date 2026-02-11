import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { requireVendor } from "@/lib/vendor-guard";
import { ObjectId } from "mongodb";

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const db = await getMongoDb();
  const salesmen = await db
    .collection("Salesman")
    .find({ vendorId: guard.userId })
    .sort({ updatedAt: -1 })
    .toArray();

  return NextResponse.json({
    salesmen: salesmen.map((s) => ({
      id: String(s._id),
      name: s.name || "Unnamed",
      phone: s.phone,
      code: s.code,
      status: s.status || "ACTIVE",
      createdAt: s.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { name, phone, code, idProofUrl } = body || {};
  if (!phone || !code) {
    return NextResponse.json({ error: "Missing phone or code" }, { status: 400 });
  }

  const db = await getMongoDb();
  const existing = await db.collection("Salesman").findOne({ phone, vendorId: guard.userId });
  if (existing) {
    return NextResponse.json({ error: "Salesman already exists" }, { status: 409 });
  }

  const created = await db.collection("Salesman").insertOne({
    vendorId: guard.userId,
    name: name || "",
    phone,
    code: String(code),
    idProofUrl: idProofUrl || null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    currentLat: null,
    currentLng: null,
    lastUpdated: null,
  });

  return NextResponse.json({ success: true, id: String(created.insertedId) });
}
