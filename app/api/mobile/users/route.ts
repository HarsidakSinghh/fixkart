import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/admin-guard";

export async function GET(req: Request) {
  const guard = await requireAdmin(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") || "";

  const client = await clerkClient();
  const response = await client.users.getUserList({
    orderBy: "-created_at",
    limit: 50,
    query,
  });

  const users = Array.isArray(response) ? response : response.data;

  const mapped = users.map((user: any) => {
    const primaryEmail = user.emailAddresses.find(
      (email: any) => email.id === user.primaryEmailAddressId
    )?.emailAddress;
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No Name";
    return {
      id: user.id,
      fullName,
      email: primaryEmail,
      status: user.banned ? "BANNED" : "ACTIVE",
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt).toISOString(),
    };
  });

  return NextResponse.json({ users: mapped });
}
