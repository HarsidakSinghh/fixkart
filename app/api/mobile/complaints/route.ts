import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { getComplaints } from "@/app/admin/actions";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const res = await getComplaints();
  if (!res.success) {
    return NextResponse.json({ error: res.error }, { status: 500 });
  }

  return NextResponse.json({ complaints: res.data });
}
