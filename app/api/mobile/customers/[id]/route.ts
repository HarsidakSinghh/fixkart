import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { updateCustomerStatus } from "@/app/admin/actions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { status } = body || {};
  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const resolved = await params;
  const res = await updateCustomerStatus(resolved.id, status);
  return NextResponse.json(res, { status: res.success ? 200 : 500 });
}
