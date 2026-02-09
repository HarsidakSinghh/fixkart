"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// --- START DUTY ACTION ---
export async function startDuty(lat: number, lng: number) {
  // 1. Get Salesman ID from Cookie
  const cookieStore = await cookies();
  const salesmanId = cookieStore.get("salesman_id")?.value;

  if (!salesmanId) return { error: "Unauthorized" };

  try {
    // 2. Update Salesman Status & Get Vendor ID (Optimized: One DB call)
    const salesman = await prisma.salesman.update({
      where: { id: salesmanId },
      data: {
        status: "ACTIVE",
        currentLat: lat,
        currentLng: lng,
        lastUpdated: new Date()
      },
      select: { vendorId: true } // Fetch vendorId immediately
    });

    // 3. Create 'START_DUTY' Checkpoint (The Green Pin)
    if (salesman && salesman.vendorId) {
      await prisma.visitCheckpoint.create({
        data: {
          salesmanId,
          vendorId: salesman.vendorId,
          type: "START_DUTY",
          lat,
          lng,
          notes: "Started work shift"
        }
      });
    }

    revalidatePath("/salesman/dashboard");
    return { success: true };

  } catch (error) {
    console.error("Start Duty Error:", error);
    return { error: "Failed to start duty" };
  }
}

// --- END DUTY ACTION ---
export async function endDuty(lat: number, lng: number) {
  const cookieStore = await cookies();
  const salesmanId = cookieStore.get("salesman_id")?.value;

  if (!salesmanId) return { error: "Unauthorized" };

  try {
    // 1. Update Status to INACTIVE & Get Vendor ID
    const salesman = await prisma.salesman.update({
      where: { id: salesmanId },
      data: {
        status: "INACTIVE",
        currentLat: lat,
        currentLng: lng,
        lastUpdated: new Date()
      },
      select: { vendorId: true }
    });

    // 2. Create 'END_DUTY' Checkpoint (Red Flag)
    if (salesman && salesman.vendorId) {
      await prisma.visitCheckpoint.create({
        data: {
          salesmanId,
          vendorId: salesman.vendorId,
          type: "END_DUTY",
          lat,
          lng,
          notes: "Shift ended"
        }
      });
    }

    revalidatePath("/salesman/dashboard");
    return { success: true };

  } catch (error) {
    console.error("End Duty Error:", error);
    // Handle case where salesman ID might be invalid (though cookie protects this)
    return { error: "Failed to end duty. Please try again." };
  }
}