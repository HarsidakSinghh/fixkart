"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// --- CREATE NEW SALESMAN ---
export async function createSalesman(formData: FormData) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const code = formData.get("code") as string;

  // 1. Basic Validation
  if (!name || !phone || !code) {
    return { error: "All fields (Name, Phone, Code) are required." };
  }

  try {
    // 2. Check if Code or Phone is already taken
    const existingSalesman = await prisma.salesman.findFirst({
      where: {
        OR: [
          { code: code },
          { phone: phone }
        ]
      }
    });

    if (existingSalesman) {
      return { error: "A salesman with this Phone Number or Access Code already exists." };
    }

    // 3. Create Salesman
    await prisma.salesman.create({
      data: {
        vendorId: userId,
        name,
        phone,
        code,
        status: "INACTIVE"
      }
    });

    revalidatePath("/vendor/team"); // (We will build this page on Day 6)
    return { success: true };

  } catch (error) {
    console.error("Create Salesman Error:", error);
    return { error: "Failed to create salesman account." };
  }
}

// --- FETCH VENDOR'S TEAM (Helper for later) ---
export async function getMySalesmen() {
  const { userId } = await auth();
  if (!userId) return [];

  return await prisma.salesman.findMany({
    where: { vendorId: userId },
    orderBy: { createdAt: "desc" }
  });
}