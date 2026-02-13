import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  isLikelyAddressMatch,
  isLikelyNameMatch,
  verifyGstinWithAppyFlow,
} from "@/lib/services/gst-verification";

export async function POST(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const resolved = await params;
  const vendorId = resolved.id;

  const vendor = await prisma.vendorProfile.findUnique({ where: { id: vendorId } });
  if (!vendor) {
    return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
  }

  const gst = String(vendor.gstNumber || "").trim().toUpperCase();
  if (!gst) {
    return NextResponse.json({ error: "Vendor has no GSTIN" }, { status: 400 });
  }

  const verification = await verifyGstinWithAppyFlow(gst);

  const data =
    verification.ok && verification.data
      ? {
          gstVerificationStatus: verification.status,
          gstVerificationError: null,
          gstVerifiedAt: new Date(),
          gstLegalName: verification.data.legalName,
          gstTradeName: verification.data.tradeName,
          gstBusinessAddress: verification.data.businessAddress,
          gstBusinessState: verification.data.businessState,
          gstBusinessPincode: verification.data.businessPincode,
          gstNameMatches: isLikelyNameMatch(vendor.companyName, verification.data.legalName, verification.data.tradeName),
          gstAddressMatches: isLikelyAddressMatch(vendor.address, verification.data.businessAddress),
          gstVerificationRaw: (verification.raw as Prisma.InputJsonValue) ?? null,
        }
      : {
          gstVerificationStatus: verification.status || "FAILED",
          gstVerificationError: verification.error || "GST verification failed",
          gstVerifiedAt: null,
          gstLegalName: null,
          gstTradeName: null,
          gstBusinessAddress: null,
          gstBusinessState: null,
          gstBusinessPincode: null,
          gstNameMatches: null,
          gstAddressMatches: null,
          gstVerificationRaw: null,
        };

  const updated = await prisma.vendorProfile.update({
    where: { id: vendorId },
    data,
  });

  return NextResponse.json({
    success: true,
    vendorId: updated.id,
    gstVerificationStatus: updated.gstVerificationStatus,
    gstLegalName: updated.gstLegalName,
    gstTradeName: updated.gstTradeName,
    gstBusinessAddress: updated.gstBusinessAddress,
    gstVerificationError: updated.gstVerificationError,
  });
}

