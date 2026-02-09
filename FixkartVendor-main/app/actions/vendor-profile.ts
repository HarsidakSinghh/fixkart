"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function getVendorProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const profile = await prisma.vendorProfile.findUnique({
      where: { userId },
    });
    return profile;
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    return null;
  }
}