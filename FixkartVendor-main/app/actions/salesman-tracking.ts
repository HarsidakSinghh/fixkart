"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function updateLocation(lat: number, lng: number) {
  const cookieStore = await cookies();
  const salesmanId = cookieStore.get("salesman_id")?.value;

  if (!salesmanId) return { error: "Unauthorized" };

  try {
    // 1. Update 'Current Location' (For Real-time Map)
    await prisma.salesman.update({
      where: { id: salesmanId },
      data: {
        currentLat: lat,
        currentLng: lng,
        lastUpdated: new Date(),
        status: "ACTIVE" // Ensure they remain active
      }
    });

    // 2. Create History Log (For Path History/Blue Line)
    await prisma.trackingLog.create({
      data: {
        salesmanId,
        lat,
        lng
      }
    });

    return { success: true };

  } catch (error) {
    console.error("Tracking Error:", error);
    return { error: "Failed to update location" };
  }
}