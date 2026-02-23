import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

type BulkAction = "SUSPEND" | "DELETE";

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const action = String(body?.action || "").toUpperCase() as BulkAction;
  const vendorIds = Array.isArray(body?.vendorIds) ? body.vendorIds.filter(Boolean) : [];

  if (!vendorIds.length) {
    return NextResponse.json({ error: "No vendors selected" }, { status: 400 });
  }
  if (action !== "SUSPEND" && action !== "DELETE") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const vendors = await prisma.vendorProfile.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, userId: true },
  });
  if (!vendors.length) {
    return NextResponse.json({ error: "No matching vendors found" }, { status: 404 });
  }

  const resolvedVendorIds = vendors.map((v) => v.id);
  const vendorUserIds = vendors.map((v) => v.userId);

  if (action === "SUSPEND") {
    const [listingResult, vendorResult] = await prisma.$transaction([
      prisma.product.deleteMany({
        where: { vendorId: { in: vendorUserIds } },
      }),
      prisma.vendorProfile.updateMany({
        where: { id: { in: resolvedVendorIds } },
        data: { status: "PENDING" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      action,
      affectedVendors: vendorResult.count,
      removedListings: listingResult.count,
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const removedListings = await tx.product.deleteMany({
      where: { vendorId: { in: vendorUserIds } },
    });

    // Remove vendor-linked records first, then vendor profile.
    await tx.refundChat.deleteMany({
      where: { refundRequest: { vendorId: { in: vendorUserIds } } },
    });
    await tx.refundRequest.deleteMany({
      where: { vendorId: { in: vendorUserIds } },
    });
    await tx.complaint.deleteMany({
      where: { vendorId: { in: vendorUserIds } },
    });
    await tx.purchaseOrder.deleteMany({
      where: { vendorId: { in: vendorUserIds } },
    });
    await tx.vendorInvoice.deleteMany({
      where: { vendorId: { in: vendorUserIds } },
    });
    await tx.orderItem.deleteMany({
      where: { vendorId: { in: vendorUserIds } },
    });
    await tx.salesman.deleteMany({
      where: { vendorId: { in: vendorUserIds } },
    });
    await tx.pushToken.deleteMany({
      where: { userId: { in: vendorUserIds }, role: "vendor" },
    });

    const vendorResult = await tx.vendorProfile.deleteMany({
      where: { id: { in: resolvedVendorIds } },
    });

    return {
      affectedVendors: vendorResult.count,
      removedListings: removedListings.count,
    };
  });

  return NextResponse.json({
    success: true,
    action,
    affectedVendors: result.affectedVendors,
    removedListings: result.removedListings,
  });
}
