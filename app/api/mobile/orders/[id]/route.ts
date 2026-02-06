import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { updateOrderDetails, updateOrderStatus } from "@/app/admin/actions";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { status, deliveryDate } = body || {};

  if (!status && !deliveryDate) {
    return NextResponse.json({ error: "Missing update data" }, { status: 400 });
  }

  if (deliveryDate) {
    const resolved = await params;
    const res = await updateOrderDetails(resolved.id, {
      status,
      deliveryDate,
    });
    return NextResponse.json(res, { status: res.success ? 200 : 500 });
  }

  const resolved = await params;
  const res = await updateOrderStatus(resolved.id, status);
  return NextResponse.json(res, { status: res.success ? 200 : 500 });
}
