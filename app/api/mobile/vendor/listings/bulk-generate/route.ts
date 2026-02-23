import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendor } from "@/lib/vendor-guard";

type DraftListing = {
  tempId: string;
  name: string;
  category: string;
  subCategory: string;
  size: string;
  price: number;
  cartonPieces: number;
  stock: number;
  brand: string;
  description: string;
  image: string;
};

const DEFAULT_CATEGORY = "Fastening & Joining";
const DEFAULT_SUBCATEGORY = "Wedge anchor";
const DEFAULT_IMAGE =
  "https://res.cloudinary.com/demo/image/upload/v1/samples/metallic-structural-detail";
const DEFAULT_CARTON_PIECES = 100;
const DEFAULT_STOCK = 100;

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function normalizeNumber(input: string) {
  const cleaned = String(input || "").replace(/[^\d.]/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : NaN;
}

function buildDescription(name: string, size: string, brand: string, cartonPieces: number) {
  return `${name} size ${size} by ${brand}. Packed as ${cartonPieces} pieces per carton. Built for durable industrial fastening and joining use cases.`;
}

function inferTypeFromName(fileName = "", text = "") {
  const hay = `${fileName} ${text}`.toLowerCase();
  if (hay.includes("stud")) return "Studs";
  if (hay.includes("u-bolt") || hay.includes("u bolt")) return "U-Bolts";
  if (hay.includes("threaded")) return "Threaded Rods";
  if (hay.includes("anchor")) return "Wedge anchor";
  return DEFAULT_SUBCATEGORY;
}

function getAutoImageByType(typeName: string) {
  const key = String(typeName || "").toLowerCase();
  if (key.includes("stud")) {
    return "https://fixkart-main.vercel.app/fastening/studs.jpg";
  }
  if (key.includes("u-bolt") || key.includes("u bolt")) {
    return "https://fixkart-main.vercel.app/fastening/u-bolts.jpg";
  }
  if (key.includes("threaded")) {
    return "https://fixkart-main.vercel.app/fastening/threaded-rods.jpg";
  }
  if (key.includes("anchor")) {
    return "https://fixkart-main.vercel.app/fastening/anchor.webp";
  }
  return DEFAULT_IMAGE;
}

function parseSizePricePairs(text: string) {
  const pairs: Array<{ size: string; price: number }> = [];
  const regexes = [
    /(\d+(?:\.\d+)?)\s*[*xX]\s*(\d+(?:\.\d+)?)\s*(?:=|:|-|is)\s*([0-9]+(?:\.[0-9]+)?)/g,
    /(\d+(?:\.\d+)?)\s*[*xX]\s*(\d+(?:\.\d+)?)\s+([0-9]+(?:\.[0-9]+)?)/g,
  ];

  for (const regex of regexes) {
    let match: RegExpExecArray | null = regex.exec(text);
    while (match) {
      const a = normalizeNumber(match[1]);
      const b = normalizeNumber(match[2]);
      const price = normalizeNumber(match[3]);
      if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(price) && price > 0) {
        pairs.push({ size: `${a}*${b}`, price });
      }
      match = regex.exec(text);
    }
  }

  return pairs;
}

function parseMatrixFallback(text: string) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const derived: Array<{ size: string; price: number }> = [];
  const defaultLengths = [16, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 120];

  for (const row of rows) {
    const tokens = row
      .replace(/\s+/g, " ")
      .split(" ")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length < 3) continue;

    const first = tokens[0].replace(/"/g, "");
    if (!/^\d+(?:\/\d+)?(?:\.\d+)?$/.test(first)) continue;

    const base = first;
    const prices = tokens
      .slice(1)
      .map((t) => normalizeNumber(t))
      .filter((n) => Number.isFinite(n) && n > 0);

    for (let i = 0; i < prices.length && i < defaultLengths.length; i += 1) {
      derived.push({ size: `${base}*${defaultLengths[i]}`, price: prices[i] });
    }
  }

  return derived;
}

async function extractTextWithOcrSpace(fileDataUrl: string) {
  const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
  const body = new URLSearchParams();
  body.set("base64Image", fileDataUrl);
  body.set("language", "eng");
  body.set("isOverlayRequired", "false");
  body.set("OCREngine", "2");
  body.set("scale", "true");

  const res = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `OCR failed: ${res.status}`);
  }

  const payload = (await res.json()) as { ParsedResults?: Array<{ ParsedText?: string }> };
  const parsedText = Array.isArray(payload?.ParsedResults)
    ? payload.ParsedResults.map((entry) => String(entry?.ParsedText || "")).join("\n")
    : "";
  return parsedText.trim();
}

export async function POST(req: Request) {
  const guard = await requireVendor(req);
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await req.json();
    const fileDataUrl = String(body?.fileDataUrl || "").trim();
    const fileName = String(body?.fileName || "").trim();

    if (!fileDataUrl.startsWith("data:")) {
      return NextResponse.json({ error: "Invalid file payload" }, { status: 400 });
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: guard.userId },
      select: { companyName: true, fullName: true },
    });
    const brand = vendor?.companyName || vendor?.fullName || "Fixkart Vendor";

    const text = await extractTextWithOcrSpace(fileDataUrl);
    const typeName = inferTypeFromName(fileName, text);
    const image = getAutoImageByType(typeName);

    const fromPairs = parseSizePricePairs(text);
    const fromMatrix = fromPairs.length ? [] : parseMatrixFallback(text);
    const seed = fromPairs.length ? fromPairs : fromMatrix;

    const uniqueMap = new Map<string, { size: string; price: number }>();
    for (const row of seed) {
      const key = `${row.size}|${row.price}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, row);
    }

    const drafts: DraftListing[] = Array.from(uniqueMap.values())
      .slice(0, 300)
      .map((row) => {
        const name = `${typeName} ${row.size}`;
        return {
          tempId: uid("draft"),
          name,
          category: DEFAULT_CATEGORY,
          subCategory: typeName,
          size: row.size,
          price: Number(row.price),
          cartonPieces: DEFAULT_CARTON_PIECES,
          stock: DEFAULT_STOCK,
          brand,
          description: buildDescription(name, row.size, brand, DEFAULT_CARTON_PIECES),
          image,
        };
      });

    return NextResponse.json({
      success: true,
      parsedTextLength: text.length,
      drafts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate listings from file";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
