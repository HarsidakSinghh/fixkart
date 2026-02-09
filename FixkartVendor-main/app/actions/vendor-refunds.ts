"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { uploadToCloudinary } from "@/lib/cloudinary"; 
import { revalidatePath } from "next/cache";
import { sendNotification } from "@/lib/notifications";

// --- 1. APPROVE REFUND ACTION ---
export async function approveRefund(requestId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    // A. Fetch Details for Notification
    const request = await prisma.refundRequest.findUnique({
        where: { id: requestId },
        include: { 
          item: { 
            include: { 
              order: {
                select: { id: true, customerName: true, customerEmail: true, customerPhone: true }
              }
            } 
          } 
        }
    });

    if (!request) return { success: false, error: "Request not found" };

    // [FIX] Guard Clause: Check if item exists before proceeding
    // Since 'item' is optional in the schema, we must verify it exists to prevent TypeScript errors.
    if (!request.item) {
        return { success: false, error: "Associated order item not found. Cannot approve." };
    }

    // B. Update Database
    await prisma.refundRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
    });

    await prisma.orderItem.update({
        where: { id: request.orderItemId },
        data: { status: "RETURNED" }
    });

    // C. Send Notification
    await sendNotification("RETURN_APPROVED", {
        toEmail: request.item.order.customerEmail,
        toPhone: request.item.order.customerPhone,
        name: request.item.order.customerName || "Customer",
        orderId: request.item.order.id
    });

    revalidatePath("/vendor/returns");
    return { success: true };

  } catch (error) {
    console.error("Approval Error:", error);
    return { success: false, error: "Failed to approve return." };
  }
}

// --- 2. REJECT (ESCALATE) REFUND ACTION ---
export async function rejectRefundWithProof(prevState: any, formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const requestId = formData.get("requestId") as string;
  const reason = formData.get("reason") as string;
  const files = formData.getAll("proofImages") as File[];

  // Validation
  if (!reason) return { error: "Rejection reason is required." };
  if (!files || files.length === 0 || files[0].size === 0) {
    return { error: "Proof of rejection (image) is required." };
  }

  const uploadedUrls: string[] = [];

  try {
    // A. Upload Vendor's Proof Images
    for (const file of files) {
      if (file.size > 0) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadResult = await uploadToCloudinary(buffer);
        uploadedUrls.push(uploadResult.secure_url);
      }
    }

    // B. Update DB: Set status to DISPUTED (Escalate to Admin)
    // Note: We do NOT change the OrderItem status yet, as the dispute is ongoing.
    await prisma.refundRequest.update({
      where: { id: requestId },
      data: { 
        status: "DISPUTED", 
        vendorRejectionReason: reason,
        vendorRejectionProof: uploadedUrls
      }
    });

    // (Optional) You could add a notification here to alert the Admin

  } catch (error) {
    console.error("Rejection Error:", error);
    return { error: "Failed to submit rejection." };
  }

  revalidatePath("/vendor/returns");
  return { success: true };
}