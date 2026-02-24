import { NextResponse } from "next/server";
import { requireVendor } from "@/lib/vendor-guard";

const GEMINI_TIMEOUT_MS = 45_000;

export const maxDuration = 120;

type GeminiDetails = {
  brand?: string;
  model?: string;
  description?: string;
  features?: string;
  weight?: string;
  color?: string;
  material?: string;
  size?: string;
  certifications?: string;
  returnsPolicy?: string;
  warrantyPolicy?: string;
};

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function stripCodeFenceJson(raw: string) {
  const text = String(raw || "").trim();
  if (!text.startsWith("```")) return text;
  return text.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
}

async function imageUrlToInlineData(url: string) {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;

  const dataMatch = trimmed.match(/^data:([^;]+);base64,(.+)$/);
  if (dataMatch?.[1] && dataMatch?.[2]) {
    return { mimeType: dataMatch[1], data: dataMatch[2] };
  }

  const res = await fetch(trimmed);
  if (!res.ok) {
    throw new Error(`Image fetch failed (${res.status})`);
  }
  const contentType = String(res.headers.get("content-type") || "image/jpeg");
  const buffer = Buffer.from(await res.arrayBuffer());
  return { mimeType: contentType, data: buffer.toString("base64") };
}

export async function POST(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const imageUrls = Array.isArray(body?.imageUrls)
      ? body.imageUrls.map((v: unknown) => String(v || "").trim()).filter(Boolean)
      : [];
    const name = String(body?.name || "").trim();
    const category = String(body?.category || "").trim();
    const subCategory = String(body?.subCategory || "").trim();

    if (!imageUrls.length) {
      return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const inlineImages = (
      await Promise.all(imageUrls.slice(0, 3).map((url: string) => imageUrlToInlineData(url)))
    ).filter(Boolean) as Array<{ mimeType: string; data: string }>;

    if (!inlineImages.length) {
      return NextResponse.json({ error: "Could not read images for AI generation." }, { status: 400 });
    }

    const prompt = `
You are helping create a marketplace product listing from product photos and box photos.
Return STRICT JSON only with this exact shape:
{
  "brand": "",
  "model": "",
  "description": "",
  "features": "",
  "weight": "",
  "color": "",
  "material": "",
  "size": "",
  "certifications": "",
  "returnsPolicy": "",
  "warrantyPolicy": ""
}

Rules:
- Product name is provided by vendor, do not change it.
- Price and commission are vendor-entered, do not infer them.
- Write a professional sales-ready description (2-4 short sentences).
- If field is unknown from image/context, return empty string.
- Keep output concise and factual, no markdown.

Vendor context:
- Name: ${name || "N/A"}
- Category: ${category || "N/A"}
- Subcategory: ${subCategory || "N/A"}
`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: prompt },
      ...inlineImages.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
    ];

    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      },
      GEMINI_TIMEOUT_MS
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[single-listing][gemini] non-200", {
        status: response.status,
        body: String(errText || "").slice(0, 1000),
      });
      return NextResponse.json({ error: `Gemini failed (${response.status})` }, { status: 502 });
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = (payload?.candidates || [])
      .flatMap((candidate) => candidate?.content?.parts || [])
      .map((part) => String(part?.text || ""))
      .join("\n")
      .trim();

    let parsed: GeminiDetails = {};
    try {
      parsed = JSON.parse(stripCodeFenceJson(rawText || "{}")) as GeminiDetails;
    } catch (error) {
      console.error("[single-listing][gemini] invalid json", {
        error: error instanceof Error ? error.message : String(error),
        preview: String(rawText || "").slice(0, 1000),
      });
      return NextResponse.json({ error: "AI response parse failed." }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      details: {
        brand: String(parsed?.brand || "").trim(),
        model: String(parsed?.model || "").trim(),
        description: String(parsed?.description || "").trim(),
        features: String(parsed?.features || "").trim(),
        weight: String(parsed?.weight || "").trim(),
        color: String(parsed?.color || "").trim(),
        material: String(parsed?.material || "").trim(),
        size: String(parsed?.size || "").trim(),
        certifications: String(parsed?.certifications || "").trim(),
        returnsPolicy: String(parsed?.returnsPolicy || "").trim(),
        warrantyPolicy: String(parsed?.warrantyPolicy || "").trim(),
      },
    });
  } catch (error) {
    console.error("[single-listing][gemini] fatal", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Could not generate listing details." }, { status: 500 });
  }
}
