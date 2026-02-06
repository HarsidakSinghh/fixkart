import { getMongoDb } from "@/lib/mongo";

export async function requireSalesman(req: Request) {
  const id = req.headers.get("x-salesman-id") || req.headers.get("X-Salesman-Id");
  if (!id) {
    return { ok: false as const, status: 401, error: "Missing Salesman ID" };
  }

  const db = await getMongoDb();
  const salesman = await db.collection("Salesman").findOne({ _id: id });

  if (!salesman || salesman.status !== "ACTIVE") {
    return { ok: false as const, status: 403, error: "Salesman not active" };
  }

  return { ok: true as const, salesman };
}
