import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { requireVendor } from "@/lib/vendor-guard";

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
      aadhaarCardUrl: s.aadhaarCardUrl || null,
      panCardUrl: s.panCardUrl || null,
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
  const { name, phone, code, aadhaarCardUrl, panCardUrl } = body || {};
  if (!phone || !code) {
    return NextResponse.json({ error: "Missing phone or code" }, { status: 400 });
  }
  if (!aadhaarCardUrl || !panCardUrl) {
    return NextResponse.json({ error: "Aadhaar card and PAN card are required" }, { status: 400 });
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
    aadhaarCardUrl: aadhaarCardUrl || null,
    panCardUrl: panCardUrl || null,
    // Backward compatibility for old admin screens.
    idProofUrl: aadhaarCardUrl || null,
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
    currentLat: null,
    currentLng: null,
    lastUpdated: null,
  });

  return NextResponse.json({ success: true, id: String(created.insertedId) });
}
