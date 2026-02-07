import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-guard";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  const guard = await requireCustomer(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const { imageBase64, filename } = body || {};
  if (!imageBase64) {
    return NextResponse.json({ error: "Missing imageBase64" }, { status: 400 });
  }

  try {
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const buffer = Buffer.from(base64Data, "base64");
    const result = await uploadToCloudinary(buffer, {
      folder: "fixkart-complaints",
      public_id: filename ? filename.replace(/\s+/g, "-") : undefined,
      resource_type: "image",
    });

    return NextResponse.json({ url: result.secure_url });
  } catch (error: any) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
