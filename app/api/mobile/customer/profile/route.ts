import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";

export async function GET(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: guard.userId },
  });

  if (!profile) {
    return NextResponse.json({
      profile: {
        userId: guard.userId,
        email: guard.email || "",
      },
    });
  }

  return NextResponse.json({
    profile: {
      id: profile.id,
      userId: profile.userId,
      status: profile.status,
      fullName: profile.fullName,
      companyName: profile.companyName,
      phone: profile.phone,
      email: profile.email,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      postalCode: profile.postalCode,
      category: profile.category,
      businessType: profile.businessType,
      yearsInBusiness: profile.yearsInBusiness,
      gstNumber: profile.gstNumber,
      tradeLicense: profile.tradeLicense,
      panNumber: profile.panNumber,
      ownerPhotoUrl: profile.ownerPhotoUrl,
      bankName: profile.bankName,
      accountHolder: profile.accountHolder,
      accountNumber: profile.accountNumber,
      ifscCode: profile.ifscCode,
    },
  });
}

export async function PATCH(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const {
    fullName,
    companyName,
    phone,
    email,
    address,
    city,
    state,
    postalCode,
    category,
    businessType,
    yearsInBusiness,
    gstNumber,
    tradeLicense,
    panNumber,
    ownerPhotoUrl,
    bankName,
    accountHolder,
    accountNumber,
    ifscCode,
  } = body || {};

  const profile = await prisma.customerProfile.upsert({
    where: { userId: guard.userId },
    update: {
      fullName: fullName || undefined,
      companyName: companyName || undefined,
      phone: phone || undefined,
      email: email || guard.email || undefined,
      address: address || undefined,
      city: city || undefined,
      state: state || undefined,
      postalCode: postalCode || undefined,
      category: category || undefined,
      businessType: businessType || undefined,
      yearsInBusiness: yearsInBusiness || undefined,
      gstNumber: gstNumber || undefined,
      tradeLicense: tradeLicense || undefined,
      panNumber: panNumber || undefined,
      ownerPhotoUrl: ownerPhotoUrl || undefined,
      bankName: bankName || undefined,
      accountHolder: accountHolder || undefined,
      accountNumber: accountNumber || undefined,
      ifscCode: ifscCode || undefined,
    },
    create: {
      userId: guard.userId,
      status: "PENDING",
      fullName: fullName || "Customer",
      companyName: companyName || fullName || "Customer",
      phone: phone || "",
      email: email || guard.email || "",
      address: address || "",
      city: city || "",
      state: state || "",
      postalCode: postalCode || "",
      category: category || null,
      businessType: businessType || null,
      yearsInBusiness: yearsInBusiness || null,
      gstNumber: gstNumber || null,
      tradeLicense: tradeLicense || null,
      panNumber: panNumber || null,
      ownerPhotoUrl: ownerPhotoUrl || null,
      bankName: bankName || null,
      accountHolder: accountHolder || null,
      accountNumber: accountNumber || null,
      ifscCode: ifscCode || null,
    },
  });

  return NextResponse.json({ success: true, profile });
}
