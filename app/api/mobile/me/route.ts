import { NextResponse } from "next/server";
import { clerkClient, verifyToken } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = ["jka8685@gmail.com", "info@thefixkart.com", "sidak798@gmail.com"];

export async function GET(req: Request) {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header) {
    return NextResponse.json({ error: "Missing auth header" }, { status: 401 });
  }
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return NextResponse.json({ error: "Invalid auth header" }, { status: 401 });
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const userId = payload?.sub;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const primaryEmail = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId
    )?.emailAddress;

    const isAdmin = !!primaryEmail && ADMIN_EMAILS.includes(primaryEmail);
    let vendorStatus: string | null = null;
    let isVendor = false;
    if (!isAdmin) {
      const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
      vendorStatus = vendor?.status || null;
      isVendor = vendor?.status === "APPROVED";
    }

    return NextResponse.json({
      userId,
      email: primaryEmail || null,
      role: isAdmin ? "admin" : isVendor ? "vendor" : "customer",
      vendorStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
