"use server";

import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/cloudinary"; // Using your existing helper
import { revalidatePath } from "next/cache";

export async function uploadOrderDoc(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const orderItemId = formData.get("orderItemId") as string;
    const docType = formData.get("docType") as "bill" | "slip";

    if (!file || !orderItemId) return { success: false, error: "Missing data" };

    // 1. Convert file to buffer for Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Upload
    // Note: ensure your uploadToCloudinary returns an object with { secure_url: string }
    const uploadResult = await uploadToCloudinary(buffer); 
    
    // 3. Update Database
    const fieldToUpdate = docType === "bill" ? "billUrl" : "transportSlipUrl";
    
    await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { [fieldToUpdate]: uploadResult.secure_url }
    });

    revalidatePath("/vendor/orders");
    return { success: true };
  } catch (error) {
    console.error("Upload Error:", error);
    return { success: false, error: "Upload failed" };
  }
}