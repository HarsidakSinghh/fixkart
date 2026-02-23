import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const resolved = await params;
  const body = await req.json();
  const {
    price,
    quantity,
    title,
    description,
    brand,
    specs,
    model,
    mrp,
    discountedPrice,
    tieredPricing,
    hsnCode,
    returnsPolicy,
    warrantyPolicy,
    weight,
    color,
    material,
    size,
    certifications,
    features,
  } = body || {};

  if (
    typeof price !== "number" &&
    typeof quantity !== "number" &&
    !title &&
    !description &&
    !brand &&
    !specs &&
    !model &&
    !mrp &&
    !discountedPrice &&
    !tieredPricing &&
    !hsnCode &&
    !returnsPolicy &&
    !warrantyPolicy &&
    !weight &&
    !color &&
    !material &&
    !size &&
    !certifications &&
    !features
  ) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const product = await prisma.product.findFirst({
    where: { id: resolved.id, vendorId: guard.userId },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const nextData: any = {};
  let requiresReview = false;
  if (typeof price === "number") {
    nextData.price = price;
    if (price !== product.price) {
      requiresReview = true;
    }
  }
  if (typeof quantity === "number") {
    nextData.quantity = quantity;
  }
  if (title) {
    nextData.title = title;
    requiresReview = true;
  }
  if (description) {
    nextData.description = description;
    requiresReview = true;
  }
  if (brand) {
    nextData.brand = brand;
    requiresReview = true;
  }

  const specPayload = {
    ...(typeof specs === "object" && specs ? specs : {}),
    ...(model ? { model } : {}),
    ...(mrp ? { mrp } : {}),
    ...(discountedPrice ? { discountedPrice } : {}),
    ...(tieredPricing ? { tieredPricing } : {}),
    ...(hsnCode ? { hsnCode } : {}),
    ...(returnsPolicy ? { returnsPolicy } : {}),
    ...(warrantyPolicy ? { warrantyPolicy } : {}),
    ...(weight ? { weight } : {}),
    ...(color ? { color } : {}),
    ...(material ? { material } : {}),
    ...(size ? { size } : {}),
    ...(certifications ? { certifications } : {}),
    ...(features ? { features } : {}),
  };

  if (Object.keys(specPayload).length > 0) {
    const currentSpecs =
      product.specs && typeof product.specs === "object" && !Array.isArray(product.specs)
        ? product.specs
        : {};
    nextData.specs = { ...(currentSpecs as Record<string, any>), ...specPayload };
    requiresReview = true;
  }

  if (requiresReview) {
    nextData.status = "PENDING";
    nextData.isPublished = false;
  }

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: nextData,
  });

  return NextResponse.json({ success: true, product: updated });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const resolved = await params;
  const product = await prisma.product.findFirst({
    where: { id: resolved.id, vendorId: guard.userId },
    select: { id: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const linkedOrderItems = await prisma.orderItem.count({
    where: { productId: product.id },
  });

  if (linkedOrderItems > 0) {
    const existingSpecs =
      (await prisma.product.findUnique({
        where: { id: product.id },
        select: { specs: true },
      }))?.specs || {};
    const nextSpecs =
      existingSpecs && typeof existingSpecs === "object" && !Array.isArray(existingSpecs)
        ? { ...(existingSpecs as Record<string, any>), deletedByVendor: true }
        : { deletedByVendor: true };

    await prisma.product.update({
      where: { id: product.id },
      data: {
        isPublished: false,
        status: "REJECTED",
        quantity: 0,
        specs: nextSpecs,
      },
    });

    return NextResponse.json({ success: true, archived: true });
  }

  await prisma.product.delete({
    where: { id: product.id },
  });

  return NextResponse.json({ success: true, deleted: true });
}
