import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { approveProduct, rejectProduct } from "@/app/admin/actions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { id } = await params;

  const body = await req.json();
  const { action } = body || {};
  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const res = action === "APPROVE" ? await approveProduct(id) : await rejectProduct(id);
  return NextResponse.json(res, { status: res.success ? 200 : 500 });
}
