import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

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
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const complaintsRaw = await prisma.complaint.findMany({
    where: { vendorId: guard.userId },
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
