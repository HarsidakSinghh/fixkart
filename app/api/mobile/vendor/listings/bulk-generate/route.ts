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
  commissionPercent: number;
};

const DEFAULT_CATEGORY = "Fastening & Joining";
const DEFAULT_SUBCATEGORY = "Bolts";
const DEFAULT_IMAGE =
  "https://res.cloudinary.com/demo/image/upload/v1/samples/metallic-structural-detail";
const DEFAULT_CARTON_PIECES = 100;
const DEFAULT_STOCK = 100;
const LENGTH_COLUMNS = [10, 12, 16, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100];

const HEX_BOLT_TABLE: Record<string, Array<number | null>> = {
  "3": [354, 352, 360, 376, 419, 783, 853, 921, 1003, 1007, null, null, null, null, null, null, null, null],
  "4": [311, 326, 339, 369, 425, 523, 606, 875, 969, 988, null, null, null, null, null, null, null, null],
  "5": [369, 393, 416, 462, 520, 606, 736, 894, 1007, 1044, 1278, 1413, 1576, 1618, 1803, 1850, null, null],
  "6": [540, 574, 619, 687, 791, 909, 1001, 1117, 1225, 1363, 1481, 1530, 1692, 1807, 1951, 2015, 2299, 2543],
  "8": [null, null, 1235, 1361, 1530, 1688, 1871, 2053, 2280, 2482, 2621, 2821, 3044, 3250, 3389, 3498, 4068, 4237],
  "10": [null, null, 2376, 2577, 2835, 3100, 3341, 3582, 3930, 4258, 4510, 4786, 5130, 5431, 5904, 6035, 6653, 7215],
  "12": [null, null, null, 3938, 4164, 4522, 5002, 5413, 5777, 6131, 6634, 7102, 7630, 7914, 8360, 8915, 9702, 10451],
  "14": [null, null, null, null, 6508, 6876, 7325, 7694, 8449, 8554, 9070, 9454, 10343, 10435, 11456, 11595, 12940, 13516],
  "16": [null, null, null, null, 8538, 9239, 9787, 10439, 11305, 11514, 12262, 13147, 14335, 14966, 15520, 16598, 18010, 19339],
  "18": [null, null, null, null, null, null, null, 15174, 16668, 16994, 17166, 18883, 20153, 21208, 22073, 23297, 25223, 27061],
  "20": [null, null, null, null, null, null, null, 18652, 20652, 21066, 20649, 23056, 24303, 25693, 26799, 28070, 30347, 32544],
  "24": [null, null, null, null, null, null, null, 29302, 30624, 31231, 32857, 33255, 36314, 37688, 39353, 41105, 44852, 48050],
};

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

function formatProductName(base: string, size: string) {
  const cleanBase = String(base || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return `${cleanBase} ${size}`.trim();
}

function getAutoImageByType(typeName: string) {
  const key = String(typeName || "").toLowerCase();
  if (key.includes("bolt")) {
    return "https://fixkart-main.vercel.app/fastening/bolts.webp";
  }
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

function parseDiaValue(diaText: string) {
  const raw = String(diaText || "").trim();
  if (!raw) return NaN;
  if (raw.includes("/")) {
    const [a, b] = raw.split("/");
    const n = Number(a);
    const d = Number(b);
    if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) return n / d;
    return NaN;
  }
  return Number(raw);
}

function parseDiaLengthRateTable(text: string) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const out: Array<{ size: string; price: number }> = [];

  const numericTokens = (line: string) =>
    (line.match(/\d+(?:\/\d+)?(?:\.\d+)?/g) || []).map((token) => token.trim());

  const looksLikeLengthHeader = (line: string) => {
    const tokens = numericTokens(line).map((t) => Number(t)).filter((n) => Number.isFinite(n));
    if (tokens.length < 8) return false;
    // Header lengths are usually in 10..100 range and ascending.
    const small = tokens.filter((n) => n >= 8 && n <= 120);
    if (small.length < 8) return false;
    let asc = 0;
    for (let i = 1; i < small.length; i += 1) {
      if (small[i] >= small[i - 1]) asc += 1;
    }
    return asc >= Math.max(6, small.length - 2);
  };

  let headerIndex = lines.findIndex((line) => /\bDIA\b/i.test(line));
  if (headerIndex < 0) {
    headerIndex = lines.findIndex((line) => looksLikeLengthHeader(line));
  }
  if (headerIndex < 0) return out;

  const headerLine = lines[headerIndex];
  const lengthTokens = numericTokens(headerLine);
  const lengths = (lengthTokens || [])
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n) && n >= 8 && n <= 200);
  if (!lengths.length) return out;

  for (let i = headerIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const parts = numericTokens(line);
    if (parts.length < 2) continue;

    const diaToken = parts[0].replace(/"/g, "");
    if (!/^\d+(?:\/\d+)?(?:\.\d+)?$/.test(diaToken)) continue;
    const diaNumeric = parseDiaValue(diaToken);
    if (!Number.isFinite(diaNumeric)) continue;

    const prices = parts
      .slice(1)
      .map((p) => normalizeNumber(p))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (!prices.length) continue;

    const rightAlign = diaNumeric >= 8 && prices.length < lengths.length;
    const startIndex = rightAlign ? Math.max(0, lengths.length - prices.length) : 0;
    for (let j = 0; j < prices.length && startIndex + j < lengths.length; j += 1) {
      const length = lengths[startIndex + j];
      const price = prices[j];
      out.push({ size: `${diaToken}*${length}`, price });
    }
  }
  return out;
}

function inferProductProfile(fileName = "", text = "") {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const topLine = lines.find(
    (line) => /[A-Za-z]/.test(line) && !/\bDIA\b/i.test(line) && !/\bRATE\b/i.test(line)
  ) || "";
  const hay = `${topLine} ${fileName} ${text}`.toLowerCase();

  if (hay.includes("hex bolt")) {
    return {
      productBaseName: "Hex bolts",
      category: "Fastening & Joining",
      subCategory: "Bolts",
      image: "https://fixkart-main.vercel.app/fastening/bolts.webp",
    };
  }
  if (hay.includes("u-bolt") || hay.includes("u bolt")) {
    return {
      productBaseName: "U-Bolts",
      category: "Fastening & Joining",
      subCategory: "U-Bolts",
      image: "https://fixkart-main.vercel.app/fastening/u-bolts.jpg",
    };
  }
  if (hay.includes("stud")) {
    return {
      productBaseName: "Studs",
      category: "Fastening & Joining",
      subCategory: "Studs",
      image: "https://fixkart-main.vercel.app/fastening/studs.jpg",
    };
  }
  if (hay.includes("threaded")) {
    return {
      productBaseName: "Threaded rods",
      category: "Fastening & Joining",
      subCategory: "Threaded Rods",
      image: "https://fixkart-main.vercel.app/fastening/threaded-rods.jpg",
    };
  }
  if (hay.includes("anchor")) {
    return {
      productBaseName: "Wedge anchor",
      category: "Fastening & Joining",
      subCategory: "Wedge anchor",
      image: "https://fixkart-main.vercel.app/fastening/anchor.webp",
    };
  }

  return {
    productBaseName: DEFAULT_SUBCATEGORY,
    category: DEFAULT_CATEGORY,
    subCategory: DEFAULT_SUBCATEGORY,
    image: getAutoImageByType(DEFAULT_SUBCATEGORY),
  };
}

function buildSeedFromHexBoltTemplate() {
  const seed: Array<{ size: string; price: number }> = [];
  for (const dia of Object.keys(HEX_BOLT_TABLE)) {
    const row = HEX_BOLT_TABLE[dia] || [];
    for (let idx = 0; idx < LENGTH_COLUMNS.length; idx += 1) {
      const price = row[idx];
      if (!price || !Number.isFinite(price)) continue;
      seed.push({ size: `${dia}*${LENGTH_COLUMNS[idx]}`, price: Number(price) });
    }
  }
  return seed;
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
    if (fileDataUrl.length > 4_000_000) {
      return NextResponse.json(
        { error: "File is too large for processing. Upload a smaller image/pdf." },
        { status: 413 }
      );
    }

    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId: guard.userId },
      select: { companyName: true, fullName: true },
    });
    const brand = vendor?.companyName || vendor?.fullName || "Fixkart Vendor";

    let text = "";
    try {
      text = await extractTextWithOcrSpace(fileDataUrl);
    } catch {
      // Keep flow alive for preview screen; UI can still edit/remove before submit.
      text = fileName;
    }
    const profile = inferProductProfile(fileName, text);
    const image = profile.image;
    let seed = parseDiaLengthRateTable(text);
    if (!seed.length && profile.productBaseName.toLowerCase().includes("hex bolt")) {
      seed = buildSeedFromHexBoltTemplate();
    }

    const uniqueMap = new Map<string, { size: string; price: number }>();
    for (const row of seed) {
      const key = `${row.size}|${row.price}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, row);
    }

    const drafts: DraftListing[] = Array.from(uniqueMap.values())
      .slice(0, 300)
      .map((row) => {
        const name = formatProductName(profile.productBaseName, row.size);
        return {
          tempId: uid("draft"),
          name,
          category: profile.category,
          subCategory: profile.subCategory,
          size: row.size,
          price: Number(row.price),
          cartonPieces: DEFAULT_CARTON_PIECES,
          stock: DEFAULT_STOCK,
          brand,
          description: buildDescription(name, row.size, brand, DEFAULT_CARTON_PIECES),
          image,
          commissionPercent: 5,
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
