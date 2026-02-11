import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const rawProducts = await prisma.product.findMany({
    where: {
      OR: [{ isPublished: false }, { status: "pending" }, { status: "PENDING" }],
    },
    orderBy: { createdAt: "desc" },
  });

  const vendorIds = Array.from(
    new Set(rawProducts.map((p) => p.vendorId).filter(Boolean))
  );

  const vendors = await prisma.vendorProfile.findMany({
    where: { userId: { in: vendorIds as string[] } },
    select: {
      userId: true,
      fullName: true,
      companyName: true,
      email: true,
      phone: true,
    },
  });

  const vendorMap = new Map(vendors.map((v) => [v.userId, v]));

  const products = rawProducts.map((p) => {
    const vendor = vendorMap.get(p.vendorId || "");
    return {
      id: p.id,
      name: p.title || p.name,
      category: p.category,
      subCategory: p.subCategory,
      price: p.price,
      commissionPercent: Number((p.specs as any)?.commissionPercent || 0),
      specs: p.specs || null,
      image: p.image,
      gallery: p.gallery || [],
      vendorId: p.vendorId || "N/A",
      createdAt: p.createdAt.toISOString(),
      description: p.description || "No description provided.",
      quantity: p.quantity || 0,
      vendorName: vendor?.companyName || vendor?.fullName || "Unknown Vendor",
      vendorEmail: vendor?.email || "N/A",
      vendorPhone: vendor?.phone || "N/A",
      status: p.status,
      isPublished: p.isPublished,
    };
  });

  return NextResponse.json({ products });
}
