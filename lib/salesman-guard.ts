import { getMongoDb } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { jwtVerify } from "jose";
import { TextEncoder } from "util";

export async function requireSalesman(req: Request) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader) {
    return { ok: false as const, status: 401, error: "Missing Authorization" };
  }
  const [type, token] = authHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return { ok: false as const, status: 401, error: "Invalid Authorization" };
  }

  const db = await getMongoDb();
  const secret = process.env.SALESMAN_JWT_SECRET;
  if (!secret) {
    return { ok: false as const, status: 500, error: "Server misconfigured" };
  }

  let subject: string | null = null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    subject = payload?.sub ? String(payload.sub) : null;
  } catch {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }

  if (!subject) {
    return { ok: false as const, status: 401, error: "Invalid token" };
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(subject);
  } catch {
    return { ok: false as const, status: 400, error: "Invalid Salesman ID" };
  }
  const salesman = await db.collection("Salesman").findOne({ _id: objectId });

  if (!salesman || salesman.status !== "ACTIVE") {
    return { ok: false as const, status: 403, error: "Salesman not active" };
  }

  return { ok: true as const, salesman };
}
