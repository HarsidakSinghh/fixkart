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
    const removedListings = await tx.product.updateMany({
      where: { vendorId: { in: vendorUserIds } },
      data: {
        isPublished: false,
        status: "REJECTED",
      },
    });

    // "Delete" in business terms: wipe profile info and disable account
    // while preserving relational integrity for historic orders.
    const vendorResult = await tx.vendorProfile.updateMany({
      where: { id: { in: resolvedVendorIds } },
      data: {
        status: "PENDING",
        fullName: "Deleted Vendor",
        companyName: null,
        phone: "0000000000",
        email: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        category: null,
        gstNumber: null,
        gstCertificateUrl: null,
        panCardUrl: null,
        idProofUrl: null,
        aadharCardUrl: null,
        locationPhotoUrl: null,
        bankName: null,
        accountHolder: null,
        accountNumber: null,
        ifscCode: null,
      },
    });

    return {
      affectedVendors: vendorResult.count,
      removedListings: removedListings.count, // hidden from app
    };
  });

  return NextResponse.json({
    success: true,
    action,
    affectedVendors: result.affectedVendors,
    removedListings: result.removedListings,
  });
}
