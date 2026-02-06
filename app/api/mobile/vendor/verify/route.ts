import { NextResponse } from "next/server";
import { requireVendor } from "@/lib/vendor-guard";

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  return NextResponse.json({
    ok: true,
    vendorId: guard.vendor.id,
    status: guard.vendor.status,
  });
}
