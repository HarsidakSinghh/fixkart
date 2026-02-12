import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";

async function getSummary(productId: string) {
  const rows = await prisma.productReview.findMany({
    where: { productId },
    orderBy: { createdAt: "desc" },
  });

  const reviewCount = rows.length;
  const total = rows.reduce((sum, row) => sum + Number(row.rating || 0), 0);
  const averageRating = reviewCount ? Number((total / reviewCount).toFixed(1)) : 0;

  return {
    averageRating,
    reviewCount,
    reviews: rows.map((row) => ({
      id: row.id,
      customerId: row.customerId,
      customerName: row.customerName,
      rating: row.rating,
      comment: row.comment,
      adminReply: row.adminReply || "",
      adminRepliedAt: row.adminRepliedAt ? row.adminRepliedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export async function GET(_req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true, isPublished: true },
  });
  if (!product || product.status !== "APPROVED" || !product.isPublished) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(await getSummary(productId));
}

export async function POST(req: Request, { params }: { params: Promise<{ productId: string }> }) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { productId } = await params;
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true, isPublished: true },
  });
  if (!product || product.status !== "APPROVED" || !product.isPublished) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await req.json();
  const rating = Number(body?.rating || 0);
  const comment = String(body?.comment || "").trim();
  if (!comment) {
    return NextResponse.json({ error: "Review text is required" }, { status: 400 });
  }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const profile = await prisma.customerProfile.findUnique({
    where: { userId: guard.userId },
    select: { fullName: true, email: true },
  });
  const customerName =
    profile?.fullName ||
    profile?.email ||
    (guard.email ? guard.email.split("@")[0] : "Customer") ||
    "Customer";

  await prisma.productReview.upsert({
    where: {
      productId_customerId: {
        productId,
        customerId: guard.userId,
      },
    },
    create: {
      productId,
      customerId: guard.userId,
      customerName,
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      comment,
    },
    update: {
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      comment,
    },
  });

  return NextResponse.json(await getSummary(productId));
}
