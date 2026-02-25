import { NextResponse } from "next/server";

const GEMINI_TIMEOUT_MS = 60_000; // Image read + analyze + response

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

type GeminiRecognizeResult = {
  productName?: string;
  confidence?: number;
  candidates?: Array<{ name: string; confidence: number }>;
};

export async function POST(req: Request) {
  try {
    let data: string;
    let mimeType: string;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      const base64 = body?.imageBase64 ?? body?.base64 ?? body?.image;
      const raw = String(base64 ?? "").trim();
      if (!raw) {
        return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 });
      }
      data = raw.replace(/^data:[^;]+;base64,/, "");
      mimeType = body?.mimeType || "image/jpeg";
    } else {
      const incoming = await req.formData();
      const image = incoming.get("image");
      if (!image || typeof (image as any)?.arrayBuffer !== "function") {
        return NextResponse.json({ error: "Image file is required" }, { status: 400 });
      }
      const buffer = Buffer.from(await (image as Blob).arrayBuffer());
      if (buffer.length > 10 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be less than 10MB" }, { status: 400 });
      }
      data = buffer.toString("base64");
      mimeType = (image as File).type || "image/jpeg";
    }

    if (Buffer.byteLength(data, "base64") > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be less than 10MB" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const prompt = `You are an expert at identifying industrial hardware and fasteners from photos.
Identify the product type shown in this image. Focus on industrial products like: bolts, nuts, screws, washers, fasteners, bearings, valves, pipe fittings, cables, motors, pumps, tools, etc.

Return ONLY strict JSON with this exact shape:
{
  "productName": "Hex Bolt",
  "confidence": 85,
  "candidates": [
    { "name": "Hex Bolt", "confidence": 85 },
    { "name": "Machine Screw", "confidence": 10 }
  ]
}

Rules:
- productName: best single product type or name (e.g. "Hex Bolt", "Flat Washer", "Hex Nut").
- confidence: 0-100, how confident you are.
- candidates: up to 5 alternatives sorted by confidence.
- Use standard industrial product names.
- If unclear or not a product, use productName "" and confidence 0.`;

    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data } },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      },
      GEMINI_TIMEOUT_MS
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[vision-gemini] non-200", { status: res.status, body: errText?.slice(0, 500) });
      return NextResponse.json(
        { error: `Gemini failed: ${res.status}` },
        { status: 502 }
      );
    }

    const payload = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const rawText = (payload?.candidates || [])
      .flatMap((c) => c?.content?.parts || [])
      .map((p) => String(p?.text || ""))
      .join("\n")
      .trim();

    let parsed: GeminiRecognizeResult = {};
    try {
      parsed = JSON.parse(stripCodeFenceJson(rawText || "{}")) as GeminiRecognizeResult;
    } catch (e) {
      console.error("[vision-gemini] invalid json", { preview: rawText?.slice(0, 300) });
      return NextResponse.json(
        { error: "Could not parse Gemini response" },
        { status: 502 }
      );
    }

    let productName = String(parsed?.productName || "").trim();
    const candidates = Array.isArray(parsed?.candidates)
      ? parsed.candidates.slice(0, 8).map((c) => ({
          name: String(c?.name || "").trim(),
          confidence: Number(c?.confidence ?? 0),
        })).filter((c) => c.name)
      : [];
    let confidence = Number(parsed?.confidence ?? 0);
    if (!productName && candidates.length) {
      productName = candidates[0].name;
      confidence = candidates[0].confidence;
    }
    if (productName && !candidates.length) {
      candidates.push({ name: productName, confidence });
    }

    return NextResponse.json({
      productName,
      confidence,
      candidates,
      source: "gemini",
    });
  } catch (error: any) {
    console.error("[vision-gemini] error", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Image recognition failed" },
      { status: 500 }
    );
  }
}
