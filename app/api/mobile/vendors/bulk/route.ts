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
      prisma.product.updateMany({
        where: { vendorId: { in: vendorUserIds } },
        data: {
          isPublished: false,
          status: "PENDING",
        },
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
      removedListings: listingResult.count, // hidden from app
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    // Keep FK integrity for historical rows by mapping vendor references to SYSTEM.
    await tx.vendorProfile.upsert({
      where: { userId: "SYSTEM" },
      update: {},
      create: {
        userId: "SYSTEM",
        status: "APPROVED",
        fullName: "System Vendor",
        companyName: "System Vendor",
        phone: "0000000000",
        email: "system@fixkart.local",
        address: "N/A",
        city: "N/A",
        state: "N/A",
        postalCode: "000000",
      },
    });

    await tx.orderItem.updateMany({
      where: { vendorId: { in: vendorUserIds } },
      data: { vendorId: "SYSTEM" },
    });
    await tx.purchaseOrder.updateMany({
      where: { vendorId: { in: vendorUserIds } },
      data: { vendorId: "SYSTEM" },
    });
    await tx.vendorInvoice.updateMany({
      where: { vendorId: { in: vendorUserIds } },
      data: { vendorId: "SYSTEM" },
    });
    await tx.refundRequest.updateMany({
      where: { vendorId: { in: vendorUserIds } },
      data: { vendorId: "SYSTEM" },
    });
    await tx.complaint.updateMany({
      where: { vendorId: { in: vendorUserIds } },
      data: { vendorId: "SYSTEM" },
    });

    const linkedRows = await tx.orderItem.findMany({
      where: { vendorId: "SYSTEM" },
      select: { productId: true },
      distinct: ["productId"],
    });
    const linkedProductIds = linkedRows.map((r) => r.productId).filter(Boolean);

    // Hard-delete listings that are not tied to orders.
    const deletedListings = await tx.product.deleteMany({
      where: {
        vendorId: { in: vendorUserIds },
        ...(linkedProductIds.length ? { id: { notIn: linkedProductIds } } : {}),
      },
    });

    // Listings tied to historical orders are hidden + transferred to SYSTEM.
    const hiddenListings = await tx.product.updateMany({
      where: {
        vendorId: { in: vendorUserIds },
        ...(linkedProductIds.length ? { id: { in: linkedProductIds } } : { id: "__none__" }),
      },
      data: {
        vendorId: "SYSTEM",
        isPublished: false,
        status: "REJECTED",
      },
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
      removedListings: deletedListings.count + hiddenListings.count, // deleted or hidden from app
    };
  });

  return NextResponse.json({
    success: true,
    action,
    affectedVendors: result.affectedVendors,
    removedListings: result.removedListings,
  });
}
