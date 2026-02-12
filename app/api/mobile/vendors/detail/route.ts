import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  let vendor = await prisma.vendorProfile.findUnique({ where: { userId: id } });
  if (!vendor) {
    vendor = await prisma.vendorProfile.findUnique({ where: { id } });
  }

  if (!vendor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const vendorProductIds = (
    await prisma.product.findMany({
      where: { vendorId: vendor.userId },
      select: { id: true },
    })
  ).map((p) => p.id);

  const ratingRows = vendorProductIds.length
    ? await prisma.productReview.findMany({
        where: { productId: { in: vendorProductIds } },
        select: { productId: true, rating: true },
      })
    : [];

  const reviewCount = ratingRows.length;
  const totalRating = ratingRows.reduce((sum, row) => sum + Number(row.rating || 0), 0);
  const averageRating = reviewCount ? Number((totalRating / reviewCount).toFixed(1)) : 0;
  const reviewedProductCount = new Set(ratingRows.map((row) => row.productId)).size;

  return NextResponse.json({
    vendor: {
      id: vendor.id,
      userId: vendor.userId,
      status: vendor.status,
      fullName: vendor.fullName,
      companyName: vendor.companyName,
      gstNumber: vendor.gstNumber,
      idProofType: vendor.idProofType,
      idProofNumber: vendor.idProofNumber,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      city: vendor.city,
      state: vendor.state,
      postalCode: vendor.postalCode,
      category: vendor.category,
      businessType: vendor.businessType,
      yearsInBusiness: vendor.yearsInBusiness,
      tradeLicense: vendor.tradeLicense,
      bankName: vendor.bankName,
      accountHolder: vendor.accountHolder,
      accountNumber: vendor.accountNumber,
      ifscCode: vendor.ifscCode,
      gstCertificateUrl: vendor.gstCertificateUrl,
      panCardUrl: vendor.panCardUrl,
      idProofUrl: vendor.idProofUrl,
      locationPhotoUrl: vendor.locationPhotoUrl,
      gpsLat: vendor.gpsLat,
      gpsLng: vendor.gpsLng,
      averageRating,
      reviewCount,
      reviewedProductCount,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    },
  });
}
