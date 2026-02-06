import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";

export async function POST(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const existing = await prisma.order.findMany({
    where: { customerId: guard.userId },
    take: 1,
  });

  if (existing.length > 0) {
    return NextResponse.json({ success: true, message: "Orders already exist" });
  }

  const products = await prisma.product.findMany({
    where: { isPublished: true },
    take: 4,
  });

  if (products.length === 0) {
    return NextResponse.json({ success: false, error: "No products available" }, { status: 400 });
  }

  const primary = products.slice(0, 2);
  const totalAmount = primary.reduce((sum, p) => sum + (p.price || 0) * 2, 0);

  await prisma.order.create({
    data: {
      customerId: guard.userId,
      customerName: guard.email?.split("@")[0] || "Customer",
      customerEmail: guard.email || "",
      customerPhone: "0000000000",
      totalAmount,
      status: "PROCESSING",
      items: {
        create: primary.map((p) => ({
          productId: p.id,
          vendorId: p.vendorId,
          quantity: 2,
          price: p.price || 0,
          productName: p.title || p.name,
          image: p.image,
          status: "PROCESSING",
        })),
      },
    },
  });

  await prisma.order.create({
    data: {
      customerId: guard.userId,
      customerName: guard.email?.split("@")[0] || "Customer",
      customerEmail: guard.email || "",
      customerPhone: "0000000000",
      totalAmount: (products[2]?.price || 0) * 1,
      status: "PENDING",
      items: {
        create: [
          {
            productId: products[2]?.id || primary[0].id,
            vendorId: products[2]?.vendorId || primary[0].vendorId,
            quantity: 1,
            price: products[2]?.price || primary[0].price || 0,
            productName: products[2]?.title || products[2]?.name || primary[0].name,
            image: products[2]?.image || primary[0].image,
            status: "PENDING",
          },
        ],
      },
    },
  });

  return NextResponse.json({ success: true });
}
