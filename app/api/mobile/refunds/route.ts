import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const rawRefunds = await prisma.refundRequest.findMany({
    include: {
      item: {
        include: {
          product: true,
          order: true,
          vendor: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const extractUrl = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (Array.isArray(val) && val.length > 0) return val[0];
    return null;
  };

  const refunds = rawRefunds.map((r) => ({
    id: r.id,
    orderItemId: r.orderItemId,
    productName: r.item?.productName || r.item?.product?.title || "Unknown Product",
    productImage: r.item?.image || r.item?.product?.image,
    customerName: r.item?.order?.customerName || "Unknown Customer",
    customerId: r.customerId,
    vendorName: r.item?.vendor?.companyName || r.item?.vendor?.fullName || "Unknown Vendor",
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    amount: (r.item?.price || 0) * (r.item?.quantity || 1),
    price: r.item?.price || 0,
    quantity: r.item?.quantity || 0,
    orderId: r.item?.orderId,
    billUrl: extractUrl(r.item?.billUrl),
    transportSlipUrl: extractUrl(r.item?.transportSlipUrl),
  }));

  return NextResponse.json({ refunds });
}
