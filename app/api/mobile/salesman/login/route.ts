import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { SignJWT } from "jose";
import { TextEncoder } from "util";

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

  const secret = process.env.SALESMAN_JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const token = await new SignJWT({
    sid: String(salesman._id),
    phone: salesman.phone,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(salesman._id))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(new TextEncoder().encode(secret));

  return NextResponse.json({
    token,
    salesman: {
      id: String(salesman._id),
      name: salesman.name,
      phone: salesman.phone,
      vendorId: salesman.vendorId,
      status: salesman.status,
    },
  });
}
