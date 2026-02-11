import { NextResponse } from "next/server";

const DEFAULT_IMAGGA_ENDPOINT = "https://api.imagga.com";

const TAG_TO_PRODUCT: Record<string, string> = {
  bolt: "Hex Bolt",
  screw: "Machine Screw",
  nut: "Hex Nut",
  washer: "Flat Washer",
  bearing: "Bearing",
  wrench: "Wrench",
  spanner: "Wrench",
  screwdriver: "Screwdriver",
  drill: "Drill Machine",
  plier: "Pliers",
  hammer: "Hammer",
  valve: "Industrial Valve",
  pipe: "Pipe Fitting",
  cable: "Electrical Cable",
  wire: "Electrical Wire",
  switch: "Electrical Switch",
  bulb: "LED Bulb",
  motor: "Electric Motor",
  pump: "Water Pump",
  compressor: "Air Compressor",
  adhesive: "Industrial Adhesive",
};

function normalizeProductFromTags(tags: Array<{ name: string; confidence: number }>) {
  for (const tag of tags) {
    const key = String(tag.name || "").toLowerCase().trim();
    if (TAG_TO_PRODUCT[key]) {
      return TAG_TO_PRODUCT[key];
    }
  }
  if (!tags.length) return "";
  return String(tags[0].name || "")
    .replace(/\b\w/g, (m) => m.toUpperCase())
    .trim();
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.IMAGGA_API_KEY;
    const apiSecret = process.env.IMAGGA_API_SECRET;
    const apiEndpoint = process.env.IMAGGA_API_ENDPOINT || DEFAULT_IMAGGA_ENDPOINT;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "Imagga is not configured on server" },
        { status: 500 }
      );
    }

    const incoming = await req.formData();
    const image = incoming.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be less than 10MB" }, { status: 400 });
    }

    const upstreamForm = new FormData();
    upstreamForm.append("image", image, image.name || "upload.jpg");

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const upstream = await fetch(`${apiEndpoint}/v2/tags?language=en`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
      },
      body: upstreamForm,
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      console.error("Imagga API error", { status: upstream.status, body });
      return NextResponse.json({ error: "Recognition failed" }, { status: 502 });
    }

    const payload = await upstream.json();
    const tags = Array.isArray(payload?.result?.tags)
      ? payload.result.tags
          .map((entry: any) => ({
            name: String(entry?.tag?.en || "").trim(),
            confidence: Number(entry?.confidence || 0),
          }))
          .filter((entry: any) => entry.name)
      : [];

    const topCandidates = tags.slice(0, 8);
    const productName = normalizeProductFromTags(topCandidates);
    const confidence = Number(topCandidates[0]?.confidence || 0);

    return NextResponse.json({
      productName,
      confidence,
      candidates: topCandidates,
    });
  } catch (error: any) {
    console.error("Vision recognize error", error);
    return NextResponse.json(
      { error: error?.message || "Unexpected recognition error" },
      { status: 500 }
    );
  }
}

