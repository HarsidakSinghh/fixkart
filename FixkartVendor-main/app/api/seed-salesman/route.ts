import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Check if test user exists
    const existing = await prisma.salesman.findUnique({
      where: { phone: "9999999999" }
    });

    if (existing) {
      return NextResponse.json({ message: "Test Salesman already exists. Login with 9999999999 / 1234" });
    }

    // 2. Create Test Salesman
    // REPLACE 'user_...' below with YOUR ACTUAL CLERK USER ID (from Vendor Profile)
    // You can find this in your MongoDB > VendorProfile > userId
    const MyVendorID = "user_2rh..."; // <--- PASTE YOUR CLERK ID HERE OR LEAVE BLANK TO TEST LOGIN ONLY

    const salesman = await prisma.salesman.create({
      data: {
        name: "Rohan (Test)",
        phone: "9999999999",
        code: "1234",
        vendorId: "test_vendor_id", // Update this if you want it linked to your real account
        status: "ACTIVE"
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Salesman Created!", 
      credentials: { phone: "9999999999", code: "1234" } 
    });

  } catch (error) {
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}