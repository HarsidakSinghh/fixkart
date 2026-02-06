import { NextResponse } from "next/server";
import { requireVendor } from "@/lib/vendor-guard";

export async function GET(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const v = guard.vendor;

  return NextResponse.json({
    vendor: {
      id: v.id,
      userId: v.userId,
      status: v.status,
      fullName: v.fullName,
      companyName: v.companyName,
      email: v.email,
      phone: v.phone,
      address: v.address,
      city: v.city,
      state: v.state,
      postalCode: v.postalCode,
      gstNumber: v.gstNumber,
      idProofType: v.idProofType,
      idProofNumber: v.idProofNumber,
      category: v.category,
      businessType: v.businessType,
      yearsInBusiness: v.yearsInBusiness,
      tradeLicense: v.tradeLicense,
      contactPerson: v.contactPerson,
      alternateContact: v.alternateContact,
      bankName: v.bankName,
      accountHolder: v.accountHolder,
      accountNumber: v.accountNumber,
      ifscCode: v.ifscCode,
      gstCertificateUrl: v.gstCertificateUrl,
      panCardUrl: v.panCardUrl,
      idProofUrl: v.idProofUrl,
      locationPhotoUrl: v.locationPhotoUrl,
      gpsLat: v.gpsLat,
      gpsLng: v.gpsLng,
    },
  });
}
