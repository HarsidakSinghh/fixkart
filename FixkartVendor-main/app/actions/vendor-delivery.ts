"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function updateDeliveryDate(itemId: string, date: string) {
  const { userId } = await auth();
  if (!userId) return;

  try {
    // Security Check: Ensure item belongs to vendor
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId }
    });

    if (item?.vendorId !== userId) return;

    // Update Date
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { deliveryDate: new Date(date) }
    });

    revalidatePath("/vendor/orders");
  } catch (error) {
    console.error("Date update failed", error);
  }
}