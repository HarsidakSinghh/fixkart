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

  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    payload = null;
  }

  let data:
    | {
        gstVerificationStatus: string;
        gstVerificationError: string | null;
        gstVerifiedAt: Date | null;
        gstLegalName: string | null;
        gstTradeName: string | null;
        gstBusinessAddress: string | null;
        gstBusinessState: string | null;
        gstBusinessPincode: string | null;
        gstNameMatches: boolean | null;
        gstAddressMatches: boolean | null;
        gstVerificationRaw: Prisma.InputJsonValue | null;
      };

  const hasPreviewPayload =
    payload &&
    (payload.gstLegalName != null || payload.gstTradeName != null || payload.gstBusinessAddress != null);

  if (hasPreviewPayload) {
    const legalName = String(payload?.gstLegalName || "").trim() || null;
    const tradeName = String(payload?.gstTradeName || "").trim() || null;
    const businessAddress = String(payload?.gstBusinessAddress || "").trim() || null;
    const businessState = String(payload?.gstBusinessState || "").trim() || null;
    const businessPincode = String(payload?.gstBusinessPincode || "").trim() || null;

    data = {
      gstVerificationStatus: String(payload?.gstVerificationStatus || "VERIFIED"),
      gstVerificationError: null,
      gstVerifiedAt: new Date(),
      gstLegalName: legalName,
      gstTradeName: tradeName,
      gstBusinessAddress: businessAddress,
      gstBusinessState: businessState,
      gstBusinessPincode: businessPincode,
      gstNameMatches:
        typeof payload?.gstNameMatches === "boolean"
          ? payload.gstNameMatches
          : isLikelyNameMatch(vendor.companyName, legalName, tradeName),
      gstAddressMatches: isLikelyAddressMatch(vendor.address, businessAddress),
      gstVerificationRaw: null,
    };
  } else {
    const verification = await verifyGstinWithAppyFlow(gst);
    data =
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
  }

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
