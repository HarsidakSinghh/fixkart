import { NextResponse } from "next/server";

const GEMINI_TIMEOUT_MS = 60_000; // Image read + analyze + response

const DEFAULT_IMAGGA_ENDPOINT = "https://api.imagga.com";
const DEFAULT_HF_MODEL_ID = "microsoft/resnet-50";
const DEFAULT_HF_INFERENCE_BASE = "https://router.huggingface.co/hf-inference/models";

const TAG_TO_BASIC: Record<string, string> = {
  bolt: "bolt",
  screw: "screw",
  nut: "nut",
  washer: "washer",
  bearing: "bearing",
  wrench: "wrench",
  spanner: "wrench",
  screwdriver: "screwdriver",
  drill: "drill",
  plier: "pliers",
  hammer: "hammer",
  valve: "valve",
  pipe: "pipe",
  cable: "cable",
  wire: "wire",
  switch: "switch",
  bulb: "bulb",
  motor: "motor",
  pump: "pump",
  compressor: "compressor",
  saw: "saw",
  grinder: "grinder",
};

type FallbackCandidate = { name: string; confidence: number; source?: string };

function toBasicName(input: string): string {
  const key = String(input || "").toLowerCase().trim();
  if (!key) return "";
  if (TAG_TO_BASIC[key]) return TAG_TO_BASIC[key];
  for (const [needle, basic] of Object.entries(TAG_TO_BASIC)) {
    if (key.includes(needle)) return basic;
  }
  return key.split(/\s+/)[0]?.toLowerCase() || key;
}

function fallbackMergeCandidates(candidates: FallbackCandidate[]): FallbackCandidate[] {
  const map = new Map<string, FallbackCandidate>();
  for (const item of candidates) {
    const name = toBasicName(item.name);
    if (!name) continue;
    const current = map.get(name);
    if (!current || item.confidence > current.confidence) {
      map.set(name, { ...item, name });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

async function fallbackCallImagga(file: File): Promise<FallbackCandidate[]> {
  const apiKey = process.env.IMAGGA_API_KEY;
  const apiSecret = process.env.IMAGGA_API_SECRET;
  const endpoint = process.env.IMAGGA_API_ENDPOINT || DEFAULT_IMAGGA_ENDPOINT;
  if (!apiKey || !apiSecret) return [];
  const form = new FormData();
  form.append("image", file, file.name || "upload.jpg");
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const res = await fetch(`${endpoint}/v2/tags?language=en`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}` },
    body: form,
  });
  if (!res.ok) return [];
  const payload = await res.json();
  return Array.isArray(payload?.result?.tags)
    ? payload.result.tags.map((e: any) => ({
        name: toBasicName(String(e?.tag?.en || "").trim()),
        confidence: Number(e?.confidence || 0),
        source: "imagga",
      })).filter((c) => c.name)
    : [];
}

async function fallbackCallHuggingFace(file: File): Promise<FallbackCandidate[]> {
  const token = process.env.HF_API_TOKEN || "";
  if (!token) return [];
  const modelIds = (process.env.HF_MODEL_ID || DEFAULT_HF_MODEL_ID).split(",").map((m) => m.trim()).filter(Boolean);
  const base = process.env.HF_INFERENCE_BASE || DEFAULT_HF_INFERENCE_BASE;
  const buffer = Buffer.from(await file.arrayBuffer());
  for (const modelId of modelIds) {
    const res = await fetch(`${base}/${modelId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": file.type || "image/jpeg" },
      body: buffer,
    });
    if (!res.ok) continue;
    const payload = await res.json();
    if (!Array.isArray(payload)) continue;
    const list = payload.map((r: any) => ({
      name: toBasicName(String(r?.label || "")),
      confidence: Number(r?.score || 0) * 100,
      source: "hf",
    })).filter((c: FallbackCandidate) => c.name);
    if (list.length) return list;
  }
  return [];
}

async function runFallbackVision(data: string, mimeType: string) {
  const buffer = Buffer.from(data, "base64");
  const file = new File([buffer], "image.jpg", { type: mimeType });
  const [imagga, hf] = await Promise.all([fallbackCallImagga(file), fallbackCallHuggingFace(file)]);
  const merged = fallbackMergeCandidates([...imagga, ...hf]);
  const productName = merged[0]?.name || "";
  const confidence = merged[0]?.confidence ?? 0;
  return { productName, confidence, candidates: merged, source: "fallback" as const };
}

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
      const fallback = await runFallbackVision(data, mimeType);
      return NextResponse.json(fallback);
    }

    const prompt = `You are an expert at identifying industrial hardware and fasteners from photos.
Identify the product type. Return the most BASIC, generic name only – 1–2 words max.

Examples of basic names:
- Chain saw → saw
- Electric drill → drill
- Hex bolt → bolt
- Flat washer → washer
- Machine screw → screw
- Hex nut → nut
- Angle grinder → grinder
- Pipe fitting → pipe

Return ONLY strict JSON:
{
  "productName": "drill",
  "confidence": 85,
  "candidates": [
    { "name": "drill", "confidence": 85 },
    { "name": "screwdriver", "confidence": 10 }
  ]
}

Rules:
- productName: single most basic word (bolt, nut, screw, washer, drill, saw, wrench, pump, valve, etc).
- Do NOT use prefixes: no "electric", "hex", "flat", "chain", "power" – just the core type.
- confidence: 0–100.
- candidates: up to 5 alternatives, all basic names.
- If unclear, use productName "" and confidence 0.`;

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
      const isQuotaOrError = res.status === 429 || res.status === 502 || res.status >= 500;
      if (isQuotaOrError) {
        console.warn("[vision-gemini] falling back (Gemini quota/error)", { status: res.status });
        const fallback = await runFallbackVision(data, mimeType);
        return NextResponse.json(fallback);
      }
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
