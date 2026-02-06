import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const customerIds = Array.from(new Set(orders.map((o) => o.customerId)));
  const customers = await prisma.customerProfile.findMany({
    where: { userId: { in: customerIds } },
  });
  const customerMap = new Map(customers.map((c) => [c.userId, c]));

  const mapped = orders.map((o) => {
    const customer = customerMap.get(o.customerId);
    return {
      id: o.id,
      customerName: o.customerName || customer?.fullName || "Customer",
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      city: customer?.city || "",
    };
  });

  return NextResponse.json({ orders: mapped });
}

export async function POST(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { items, billing, paymentMethod } = body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const requiredBilling = [
    billing?.fullName,
    billing?.phone,
    billing?.address,
    billing?.city,
    billing?.state,
    billing?.postalCode,
  ];

  if (requiredBilling.some((value) => !value)) {
    return NextResponse.json({ error: "Missing billing details" }, { status: 400 });
  }

  const productIds = items.map((item: any) => item.productId).filter(Boolean);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const missing = productIds.find((id: string) => !productMap.has(id));
  if (missing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  let totalAmount = 0;
  const orderItems = items.map((item: any) => {
    const product = productMap.get(item.productId)!;
    const quantity = Math.max(1, Number(item.qty || 1));

    if (product.quantity < quantity) {
      throw new Error(`Insufficient stock for ${product.title || product.name}`);
    }

    const price = Number(product.price || 0);
    totalAmount += price * quantity;

    return {
      productId: product.id,
      vendorId: product.vendorId,
      quantity,
      price,
      productName: product.title || product.name || "Product",
      image: product.image || null,
    };
  });

  try {
    const result = await prisma.$transaction(async (tx) => {
      const addressLine = `${billing.address}, ${billing.city}, ${billing.state} ${billing.postalCode}`;

      await tx.customerProfile.upsert({
        where: { userId: guard.userId },
        update: {
          fullName: billing.fullName,
          phone: billing.phone,
          email: guard.email || billing.email || "",
          address: billing.address,
          city: billing.city,
          state: billing.state,
          postalCode: billing.postalCode,
        },
        create: {
          userId: guard.userId,
          status: "PENDING",
          fullName: billing.fullName,
          companyName: billing.companyName || billing.fullName,
          phone: billing.phone,
          email: guard.email || billing.email || "",
          address: billing.address,
          city: billing.city,
          state: billing.state,
          postalCode: billing.postalCode,
        },
      });

      const order = await tx.order.create({
        data: {
          customerId: guard.userId,
          customerName: billing.fullName,
          customerEmail: guard.email || billing.email || "",
          customerPhone: billing.phone,
          totalAmount,
          status: "PENDING",
          paymentMethod: paymentMethod || null,
          billingAddress: addressLine,
          items: {
            create: orderItems,
          },
        },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      return order;
    });

    return NextResponse.json({ success: true, orderId: result.id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Order failed" }, { status: 400 });
  }
}
