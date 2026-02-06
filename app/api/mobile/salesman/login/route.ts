import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";

export async function POST(req: Request) {
  const body = await req.json();
  const { phone, code } = body || {};

  if (!phone || !code) {
    return NextResponse.json({ error: "phone and code are required" }, { status: 400 });
  }

  const db = await getMongoDb();
  const salesman = await db.collection("Salesman").findOne({
    phone,
    code,
    status: "ACTIVE",
  });

  if (!salesman) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({
    token: String(salesman._id),
    salesman: {
      id: String(salesman._id),
      name: salesman.name,
      phone: salesman.phone,
      vendorId: salesman.vendorId,
      status: salesman.status,
    },
  });
}
