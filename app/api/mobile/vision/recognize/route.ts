import { NextResponse } from "next/server";

const DEFAULT_IMAGGA_ENDPOINT = "https://api.imagga.com";
const DEFAULT_HF_MODEL_ID = "microsoft/resnet-50";
const DEFAULT_HF_INFERENCE_BASE = "https://router.huggingface.co/hf-inference/models";

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

type Candidate = {
  name: string;
  confidence: number;
  source?: string;
};

function normalizeLabel(input: string): string {
  const key = String(input || "").toLowerCase().trim();
  if (!key) return "";
  if (TAG_TO_PRODUCT[key]) return TAG_TO_PRODUCT[key];

  const pairs = Object.entries(TAG_TO_PRODUCT);
  for (const [needle, normalized] of pairs) {
    if (key.includes(needle)) return normalized;
  }

  return key.replace(/\b\w/g, (m) => m.toUpperCase()).trim();
}

function normalizeProductFromTags(tags: Candidate[]) {
  for (const tag of tags) {
    const normalized = normalizeLabel(tag.name);
    if (normalized) {
      return normalized;
    }
  }
  if (!tags.length) return "";
  return normalizeLabel(String(tags[0].name || ""));
}

async function callHuggingFace(image: File): Promise<Candidate[]> {
  const token = process.env.HF_API_TOKEN || "";
  if (!token) return [];

  const configured = process.env.HF_MODEL_ID || DEFAULT_HF_MODEL_ID;
  const modelIds = configured
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const base = process.env.HF_INFERENCE_BASE || DEFAULT_HF_INFERENCE_BASE;
  const buffer = Buffer.from(await image.arrayBuffer());

  for (const modelId of modelIds) {
    const endpoint = `${base}/${modelId}`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": image.type || "application/octet-stream",
      },
      body: buffer,
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("HuggingFace API error", { modelId, status: res.status, body });
      continue;
    }

    const payload = await res.json();
    if (!Array.isArray(payload)) continue;

    const candidates = payload
      .map((row: any) => ({
        name: normalizeLabel(String(row?.label || "")),
        confidence: Number(row?.score || 0) * 100,
        source: "hf",
      }))
      .filter((row: Candidate) => row.name && !Number.isNaN(row.confidence))
      .sort((a: Candidate, b: Candidate) => b.confidence - a.confidence)
      .slice(0, 8);

    if (candidates.length) return candidates;
  }

  return [];
}

async function callImagga(image: File): Promise<Candidate[]> {
  const apiKey = process.env.IMAGGA_API_KEY;
  const apiSecret = process.env.IMAGGA_API_SECRET;
  const apiEndpoint = process.env.IMAGGA_API_ENDPOINT || DEFAULT_IMAGGA_ENDPOINT;
  if (!apiKey || !apiSecret) return [];

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
    return [];
  }

  const payload = await upstream.json();
  return Array.isArray(payload?.result?.tags)
    ? payload.result.tags
        .map((entry: any) => ({
          name: normalizeLabel(String(entry?.tag?.en || "").trim()),
          confidence: Number(entry?.confidence || 0),
          source: "imagga",
        }))
        .filter((entry: Candidate) => entry.name)
        .slice(0, 8)
    : [];
}

function mergeCandidates(candidates: Candidate[]): Candidate[] {
  const map = new Map<string, Candidate>();
  for (const item of candidates) {
    if (!item.name) continue;
    const current = map.get(item.name);
    if (!current || item.confidence > current.confidence) {
      map.set(item.name, item);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}

export async function POST(req: Request) {
  try {
    const incoming = await req.formData();
    const image = incoming.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be less than 10MB" }, { status: 400 });
    }

    const [imaggaCandidates, hfCandidates] = await Promise.all([
      callImagga(image),
      callHuggingFace(image),
    ]);
    const topCandidates = mergeCandidates([...imaggaCandidates, ...hfCandidates]);

    if (!topCandidates.length) {
      return NextResponse.json(
        { error: "Vision service is not configured" },
        { status: 500 }
      );
    }
    const productName = normalizeProductFromTags(topCandidates);
    const confidence = Number(topCandidates[0]?.confidence || 0);

    return NextResponse.json({
      productName,
      confidence,
      candidates: topCandidates,
      source: "ensemble",
    });
  } catch (error: any) {
    console.error("Vision recognize error", error);
    return NextResponse.json(
      { error: error?.message || "Unexpected recognition error" },
      { status: 500 }
    );
  }
}
