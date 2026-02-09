"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 1. LOGIN ACTION
export async function loginSalesman(prevState: any, formData: FormData) {
  const phone = formData.get("phone") as string;
  const code = formData.get("code") as string;

  if (!phone || !code) return { error: "Please enter Phone and Code" };

  try {
    // Find Salesman
    const salesman = await prisma.salesman.findUnique({
      where: { phone, code }, // Matches both Phone & Access Code
    });

    if (!salesman) {
      return { error: "Invalid Phone Number or Access Code" };
    }

    if (salesman.status === "INACTIVE") {
       // Optional: You could block them here, but for now we allow access
    }

    // Set Session Cookie (7 Days)
    const cookieStore = await cookies();
    cookieStore.set("salesman_id", salesman.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 Days
        path: "/",
        sameSite: "lax"
    });

    return { success: true };
    
  } catch (error) {
    console.error("Login Error:", error);
    return { error: "Something went wrong" };
  }
}

// 2. LOGOUT ACTION
export async function logoutSalesman() {
  const cookieStore = await cookies();
  cookieStore.delete("salesman_id");
  redirect("/salesman/login");
}

// 3. GET SESSION (For Server Components)
export async function getSalesmanSession() {
  const cookieStore = await cookies();
  const salesmanId = cookieStore.get("salesman_id")?.value;
  if (!salesmanId) return null;

  try {
    return await prisma.salesman.findUnique({
      where: { id: salesmanId }
    });
  } catch (e) {
    return null;
  }
}