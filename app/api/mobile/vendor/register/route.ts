import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";

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
      gstNumber: gstNumber || null,
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
      gstNumber: gstNumber || null,
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

  return NextResponse.json({ success: true, vendorId: vendor.id, status: vendor.status });
}
