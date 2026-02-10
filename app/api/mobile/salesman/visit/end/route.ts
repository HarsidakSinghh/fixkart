import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongo";
import { requireSalesman } from "@/lib/salesman-guard";
import { uploadToCloudinary } from "@/lib/cloudinary";

export async function POST(req: Request) {
  const guard = await requireSalesman(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const body = await req.json();
  const {
    customerId,
    outcome,
    note,
    lat,
    lng,
    imageBase64,
    companyName,
    companyAddress,
    followUpDate,
  } = body || {};

  let imageUrl: string | null = null;
  if (imageBase64 && typeof imageBase64 === "string") {
    try {
      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      const buffer = Buffer.from(base64Data, "base64");
      const result = await uploadToCloudinary(buffer, {
        folder: "fixkart-visits",
        resource_type: "image",
      });
      imageUrl = result.secure_url;
    } catch (error) {
      imageUrl = null;
    }
  }

  const db = await getMongoDb();
  await db.collection("TrackingLog").insertOne({
    salesmanId: String(guard.salesman._id),
    event: "VISIT_END",
    customerId: customerId || null,
    note: outcome ? `${outcome}${note ? ` - ${note}` : ""}` : note || null,
    companyName: companyName || null,
    companyAddress: companyAddress || null,
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    imageUrl,
    createdAt: new Date(),
  });

  if (typeof lat === "number" && typeof lng === "number") {
    await db.collection("Salesman").updateOne(
      { _id: guard.salesman._id },
      {
        $set: {
          currentLat: lat,
          currentLng: lng,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        },
      }
    );
  }

  if (outcome === "Follow-up Required" && followUpDate) {
    await db.collection("SalesmanAssignment").insertOne({
      vendorId: guard.salesman.vendorId,
      salesmanId: String(guard.salesman._id),
      companyName: companyName || "Follow-up",
      address: companyAddress || "",
      note: note || "",
      status: "PENDING",
      visitDate: followUpDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return NextResponse.json({ success: true });
}
