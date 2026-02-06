import { auth, clerkClient, getAuth, verifyToken } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function getBearerToken(req?: Request) {
  if (!req) return null;
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

export async function requireVendor(req?: Request) {
  let userId: string | null | undefined;

  if (req && isNextRequest(req)) {
    const authData = getAuth(req);
    userId = authData.userId;
  } else {
    const authData = await auth();
    userId = authData.userId;
  }

  if (!userId && req) {
    const bearer = getBearerToken(req);
    if (bearer) {
      try {
        const payload = await verifyToken(bearer, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        userId = payload?.sub || null;
      } catch (err: any) {
        console.error("[vendor-guard] verifyToken failed", err?.message || err);
        return { ok: false as const, status: 401, error: "Unauthorized" };
      }
    } else {
      console.error("[vendor-guard] No bearer token provided");
    }
  }

  if (!userId) {
    return { ok: false as const, status: 401, error: "Unauthorized" };
  }

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendor || vendor.status !== "APPROVED") {
    return { ok: false as const, status: 403, error: "Vendor not approved" };
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId
  )?.emailAddress;

  return { ok: true as const, userId, email: primaryEmail, vendor };
}

function isNextRequest(req: Request): req is NextRequest {
  return "cookies" in req && "nextUrl" in req;
}
