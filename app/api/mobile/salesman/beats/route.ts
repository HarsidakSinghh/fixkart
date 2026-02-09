import { NextResponse } from "next/server";
import { requireSalesman } from "@/lib/salesman-guard";
import { getMongoDb } from "@/lib/mongo";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const guard = await requireSalesman(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const db = await getMongoDb();
  const assignments = await db
    .collection("SalesmanAssignment")
    .find({ salesmanId: String(guard.salesman._id), status: "PENDING" })
    .sort({ createdAt: -1 })
    .limit(12)
    .toArray();

  if (assignments.length) {
    const beats = assignments.map((a, idx) => ({
      id: String(a._id),
      name: a.companyName,
      city: "",
      address: a.address,
      note: a.note || "",
      status: "PENDING",
      priority: idx < 3 ? "HIGH" : "MEDIUM",
      source: "ASSIGNED",
    }));
    return NextResponse.json({ beats });
  }

  const customers = await prisma.customerProfile.findMany({
    take: 8,
    orderBy: { updatedAt: "desc" },
  });

  const beats = customers.map((c, idx) => ({
    id: c.id,
    name: c.companyName || c.fullName,
    city: c.city,
    address: c.address,
    status: "PENDING",
    priority: idx < 3 ? "HIGH" : "MEDIUM",
    source: "AUTO",
  }));

  return NextResponse.json({ beats });
}
