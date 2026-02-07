import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@clerk/nextjs/server";

function getBearerToken(req: Request) {
  const header = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;
  return token.trim();
}

export async function POST(req: Request) {
  const bearer = getBearerToken(req);
  if (!bearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId: string | null = null;
  try {
    const payload = await verifyToken(bearer, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    userId = payload?.sub || null;
  } catch (err: any) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { token, role, platform } = body || {};

  if (!token || !role) {
    return NextResponse.json({ error: "Missing token or role" }, { status: 400 });
  }

  await prisma.pushToken.upsert({
    where: { token },
    update: { userId, role, platform: platform || null },
    create: { userId, role, token, platform: platform || null },
  });

  return NextResponse.json({ success: true });
}
