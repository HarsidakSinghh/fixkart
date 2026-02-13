import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-guard";

function parseComplaintImages(imageUrl?: string | null) {
  if (!imageUrl) return [];
  try {
    const parsed = JSON.parse(imageUrl);
    if (Array.isArray(parsed)) {
      return parsed.filter((u) => typeof u === "string" && u.trim().length > 0);
    }
  } catch {
    // Legacy single URL format
  }
  return [imageUrl];
}

export async function GET(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const complaintsRaw = await prisma.complaint.findMany({
    where: { customerId: guard.userId },
    select: {
      id: true,
      orderId: true,
      orderItemId: true,
      vendorId: true,
      customerId: true,
      message: true,
      imageUrl: true,
      status: true,
      createdAt: true,
      vendorResponse: true,
      actionTaken: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const complaints = complaintsRaw.map((c) => {
    const imageUrls = parseComplaintImages(c.imageUrl);
    return {
      ...c,
      imageUrls,
      imageUrl: imageUrls[0] || null,
    };
  });

  return NextResponse.json({ complaints });
}
