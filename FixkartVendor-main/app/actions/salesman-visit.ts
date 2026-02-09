"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { uploadToCloudinary } from "@/lib/cloudinary"; // Using your existing helper
import { revalidatePath } from "next/cache";

export async function submitShopVisit(formData: FormData) {
  const cookieStore = await cookies();
  const salesmanId = cookieStore.get("salesman_id")?.value;

  if (!salesmanId) return { error: "Unauthorized" };

  const shopName = formData.get("shopName") as string;
  const notes = formData.get("notes") as string;
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);
  const file = formData.get("image") as File;

  if (!shopName || !file || isNaN(lat)) {
    return { error: "Missing required fields (Shop Name, Photo, or Location)." };
  }

  try {
    // 1. Get Vendor ID (to keep data relational)
    const salesman = await prisma.salesman.findUnique({
      where: { id: salesmanId },
      select: { vendorId: true }
    });

    if (!salesman) return { error: "Salesman not found" };

    // 2. Upload Photo
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadRes = await uploadToCloudinary(buffer);

    // 3. Save Checkpoint (The Pin on the Map)
    await prisma.visitCheckpoint.create({
      data: {
        salesmanId,
        vendorId: salesman.vendorId,
        type: "SHOP_VISIT",
        shopName,
        notes,
        lat,
        lng,
        imageUrl: uploadRes.secure_url
      }
    });

    revalidatePath("/salesman/dashboard");
    return { success: true };

  } catch (error) {
    console.error("Visit Error:", error);
    return { error: "Failed to submit visit." };
  }
}