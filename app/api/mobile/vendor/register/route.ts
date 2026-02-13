import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";
import { Prisma } from "@prisma/client";
import {
  isLikelyAddressMatch,
  isLikelyNameMatch,
  isValidGstin,
  verifyGstinWithAppyFlow,
} from "@/lib/services/gst-verification";

export async function POST(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const {
    businessName,
    gstNumber,
    panNumber,
    address,
    city,
    state,
    postalCode,
    contactName,
    contactPhone,
    contactEmail,
    categories,
    bankName,
    accountHolder,
    accountNumber,
    ifscCode,
    docType,
    docData,
    gpsLat,
    gpsLng,
    locationPhoto,
  } = body || {};

  if (!businessName || !contactName || !contactPhone || !contactEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const categoryValue = Array.isArray(categories) ? categories.join(", ") : categories || null;
  const gst = String(gstNumber || "").trim().toUpperCase();

  if (gst && !isValidGstin(gst)) {
    return NextResponse.json(
      { error: "Invalid GSTIN format. Please enter a valid 15-character GST number." },
      { status: 400 }
    );
  }

  const docFields: Record<string, string | null> = {
    gstCertificateUrl: null,
    panCardUrl: null,
    idProofUrl: null,
  };

  if (docData && docType) {
    if (docType === "GST") docFields.gstCertificateUrl = docData;
    else if (docType === "PAN") docFields.panCardUrl = docData;
    else docFields.idProofUrl = docData;
  }

  let gstVerificationStatus = "NOT_PROVIDED";
  let gstVerificationError: string | null = null;
  let gstVerifiedAt: Date | null = null;
  let gstLegalName: string | null = null;
  let gstTradeName: string | null = null;
  let gstBusinessAddress: string | null = null;
  let gstBusinessState: string | null = null;
  let gstBusinessPincode: string | null = null;
  let gstNameMatches: boolean | null = null;
  let gstAddressMatches: boolean | null = null;
  let gstVerificationRaw: Prisma.InputJsonValue | null = null;

  if (gst) {
    const verification = await verifyGstinWithAppyFlow(gst);
    gstVerificationStatus = verification.status;

    if (verification.ok && verification.data) {
      gstVerifiedAt = new Date();
      gstLegalName = verification.data.legalName;
      gstTradeName = verification.data.tradeName;
      gstBusinessAddress = verification.data.businessAddress;
      gstBusinessState = verification.data.businessState;
      gstBusinessPincode = verification.data.businessPincode;
      gstVerificationRaw = (verification.raw as Prisma.InputJsonValue) ?? null;
      gstNameMatches = isLikelyNameMatch(businessName, gstLegalName, gstTradeName);
      gstAddressMatches = isLikelyAddressMatch(address, gstBusinessAddress);
    } else {
      gstVerificationError = verification.error || "GST verification failed";
    }
  }

  const vendor = await prisma.vendorProfile.upsert({
    where: { userId: guard.userId },
    update: {
      status: "PENDING",
      fullName: contactName,
      companyName: businessName,
      phone: contactPhone,
      email: contactEmail,
      address: address || "",
      city: city || "",
      state: state || "",
      postalCode: postalCode || "",
      gstNumber: gst || null,
      gstVerificationStatus,
      gstVerificationError,
      gstVerifiedAt,
      gstLegalName,
      gstTradeName,
      gstBusinessAddress,
      gstBusinessState,
      gstBusinessPincode,
      gstNameMatches,
      gstAddressMatches,
      gstVerificationRaw,
      idProofType: panNumber ? "PAN" : undefined,
      idProofNumber: panNumber || null,
      category: categoryValue,
      bankName: bankName || null,
      accountHolder: accountHolder || null,
      accountNumber: accountNumber || null,
      ifscCode: ifscCode || null,
      locationPhotoUrl: locationPhoto || null,
      gpsLat: typeof gpsLat === "number" ? gpsLat : null,
      gpsLng: typeof gpsLng === "number" ? gpsLng : null,
      ...docFields,
    },
    create: {
      userId: guard.userId,
      status: "PENDING",
      fullName: contactName,
      companyName: businessName,
      phone: contactPhone,
      email: contactEmail,
      address: address || "",
      city: city || "",
      state: state || "",
      postalCode: postalCode || "",
      gstNumber: gst || null,
      gstVerificationStatus,
      gstVerificationError,
      gstVerifiedAt,
      gstLegalName,
      gstTradeName,
      gstBusinessAddress,
      gstBusinessState,
      gstBusinessPincode,
      gstNameMatches,
      gstAddressMatches,
      gstVerificationRaw,
      idProofType: panNumber ? "PAN" : null,
      idProofNumber: panNumber || null,
      category: categoryValue,
      bankName: bankName || null,
      accountHolder: accountHolder || null,
      accountNumber: accountNumber || null,
      ifscCode: ifscCode || null,
      locationPhotoUrl: locationPhoto || null,
      gpsLat: typeof gpsLat === "number" ? gpsLat : null,
      gpsLng: typeof gpsLng === "number" ? gpsLng : null,
      ...docFields,
    },
  });

  return NextResponse.json({
    success: true,
    vendorId: vendor.id,
    status: vendor.status,
    gstVerificationStatus: vendor.gstVerificationStatus,
    gstNameMatches: vendor.gstNameMatches,
    gstAddressMatches: vendor.gstAddressMatches,
  });
}
