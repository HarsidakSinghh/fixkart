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
type OcrWord = {
  WordText?: string;
  Left?: number;
  Top?: number;
  Width?: number;
  Height?: number;
};

const DEFAULT_SUBCATEGORY = "Bolts";
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

function normalizeOcrToken(input: string) {
  return String(input || "")
    .replace(/[Oo]/g, "0")
    .replace(/[lI]/g, "1")
    .trim();
}

function parseNumberToken(raw: string) {
  const t = normalizeOcrToken(raw);
  if (!t) return NaN;
  if (/^\d+\/\d+$/.test(t)) {
    const [a, b] = t.split("/");
    const n = Number(a);
    const d = Number(b);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return NaN;
    return n / d;
  }
  return Number(t);
}

function normalizeSizeToken(raw: string) {
  const cleaned = String(raw || "")
    .replace(/["']/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!cleaned) return "";

  // OCR often reads mixed fractions as 1.1/4 or 1-1/4.
  const mixed = cleaned.match(/^(\d+)[.\-](\d+)\/(\d+)$/);
  if (mixed) {
    return `${mixed[1]}-${mixed[2]}/${mixed[3]}`;
  }
  if (/^\d+\/\d+$/.test(cleaned)) return cleaned;
  if (/^\d+(?:\.\d+)?$/.test(cleaned)) return cleaned;
  return "";
}

function hasFractionalSizes(text: string) {
  return /\d+\s*\/\s*\d+/.test(String(text || ""));
}

function normalizeMachineScrewLengths(lengths: number[], machineScrewHint: boolean) {
  const uniqueSorted = Array.from(
    new Set(
      lengths
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n >= 2 && n <= 200)
        .sort((a, b) => a - b)
    )
  );
  if (!machineScrewHint || !uniqueSorted.length) return uniqueSorted;

  const first = uniqueSorted[0];
  if (first >= 8) return [4, 5, 6, ...uniqueSorted];
  if (first === 6) return [4, 5, ...uniqueSorted];
  if (first === 5) return [4, ...uniqueSorted];
  return uniqueSorted;
}

function parseDiaLengthRateTable(text: string) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const out: Array<{ size: string; price: number }> = [];

  const normalizeOcrLine = (line: string) => normalizeOcrToken(line);

  const numericTokens = (line: string) =>
    (normalizeOcrLine(line).match(/\d+(?:\/\d+)?(?:\.\d+)?/g) || []).map((token) => token.trim());

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
  const machineScrewHint = /machine\s*screw/i.test(text);
  let lengths = (lengthTokens || [])
    .map((t) => Number(t))
    .filter((n) => Number.isFinite(n) && n >= 2 && n <= 200);
  lengths = normalizeMachineScrewLengths(lengths, machineScrewHint);
  let lengthLabels = lengths.map((n) => String(n));
  if (!lengthLabels.length) {
    lengthLabels = (lengthTokens || []).map(normalizeSizeToken).filter(Boolean);
  }
  if (!lengthLabels.length) return out;

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

    const rightAlign = diaNumeric >= 8 && prices.length < lengthLabels.length;
    const startIndex = rightAlign ? Math.max(0, lengthLabels.length - prices.length) : 0;
    for (let j = 0; j < prices.length && startIndex + j < lengthLabels.length; j += 1) {
      const length = lengthLabels[startIndex + j];
      const price = prices[j];
      out.push({ size: `${diaToken}*${length}`, price });
    }
  }
  return out;
}

function clusterRowsByY(words: Array<{ x: number; y: number; text: string }>) {
  const sorted = [...words].sort((a, b) => a.y - b.y);
  const rows: Array<Array<{ x: number; y: number; text: string }>> = [];
  const tolerance = 14;
  for (const word of sorted) {
    const last = rows[rows.length - 1];
    if (!last) {
      rows.push([word]);
      continue;
    }
    const avgY = last.reduce((sum, w) => sum + w.y, 0) / last.length;
    if (Math.abs(word.y - avgY) <= tolerance) {
      last.push(word);
    } else {
      rows.push([word]);
    }
  }
  return rows.map((row) => row.sort((a, b) => a.x - b.x));
}

function parseTableFromOverlay(words: OcrWord[]) {
  const points = words
    .map((w) => {
      const text = String(w.WordText || "").trim();
      const left = Number(w.Left || 0);
      const top = Number(w.Top || 0);
      const width = Number(w.Width || 0);
      const height = Number(w.Height || 0);
      return { text, x: left + width / 2, y: top + height / 2, left, top, width, height };
    })
    .filter((w) => w.text);
  if (!points.length) return [];

  const diaWord = points.find((w) => /\bDIA\b/i.test(w.text));
  if (!diaWord) return [];

  const headerBandY = diaWord.y;
  const headerBandHeight = Math.max(16, diaWord.height * 1.8);
  const headerNums = points
    .filter((w) => Math.abs(w.y - headerBandY) <= headerBandHeight)
    .map((w) => ({ ...w, n: parseNumberToken(w.text) }))
    .filter((w) => Number.isFinite(w.n) && w.n >= 2 && w.n <= 200)
    .sort((a, b) => a.x - b.x);
  if (headerNums.length < 6) return [];

  let colHeaders = headerNums.map((h) => ({ x: h.x, len: String(Number(h.n)) }));
  const machineScrewHint = /machine\s*screw/i.test(points.map((p) => p.text).join(" "));
  const normalizedLens = normalizeMachineScrewLengths(
    colHeaders.map((h) => Number(h.len)),
    machineScrewHint
  );
  if (normalizedLens.length !== colHeaders.length) {
    const firstX = colHeaders[0]?.x ?? 0;
    const secondX = colHeaders[1]?.x ?? firstX + 35;
    const step = Math.max(14, secondX - firstX);
    const xByLen = new Map(colHeaders.map((h) => [h.len, h.x]));
    colHeaders = normalizedLens.map((len, idx) => ({
      len: String(len),
      x: xByLen.get(String(len)) ?? firstX + idx * step,
    }));
  }
  if (hasFractionalSizes(points.map((p) => p.text).join(" "))) {
    const fractionalHeader = points
      .filter((w) => Math.abs(w.y - headerBandY) <= headerBandHeight)
      .map((w) => ({ x: w.x, s: normalizeSizeToken(w.text) }))
      .filter((w) => Boolean(w.s))
      .sort((a, b) => a.x - b.x);
    if (fractionalHeader.length >= 4) {
      colHeaders = fractionalHeader.map((h) => ({ x: h.x, len: h.s }));
    }
  }
  const minHeaderX = colHeaders[0].x;
  const rowCandidates = points.filter((w) => w.y > headerBandY + headerBandHeight);
  const clusteredRows = clusterRowsByY(rowCandidates.map((w) => ({ x: w.x, y: w.y, text: w.text })));

  const seed: Array<{ size: string; price: number }> = [];
  for (const row of clusteredRows) {
    const diaCell = row.find((c) => c.x < minHeaderX - 10 && Number.isFinite(parseNumberToken(c.text)));
    if (!diaCell) continue;
    const diaTokenRaw = normalizeSizeToken(diaCell.text) || normalizeOcrToken(diaCell.text).replace(/"/g, "");
    if (!diaTokenRaw) continue;

    for (const cell of row) {
      if (cell === diaCell) continue;
      const price = parseNumberToken(cell.text);
      if (!Number.isFinite(price) || price <= 0) continue;
      const nearest = colHeaders.reduce(
        (best, col) => {
          const dist = Math.abs(col.x - cell.x);
          return dist < best.dist ? { dist, col } : best;
        },
        { dist: Number.POSITIVE_INFINITY, col: colHeaders[0] }
      );
      if (nearest.dist > 40) continue;
      seed.push({ size: `${diaTokenRaw}*${nearest.col.len}`, price: Number(price) });
    }
  }
  return seed;
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
      knownType: true,
    };
  }
  if (hay.includes("machine screw")) {
    return {
      productBaseName: "Machine screw",
      category: "",
      subCategory: "Machine screw",
      image: "https://fixkart-main.vercel.app/fastening/screws.jpg",
      knownType: false,
    };
  }
  if (hay.includes("u-bolt") || hay.includes("u bolt")) {
    return {
      productBaseName: "U-Bolts",
      category: "Fastening & Joining",
      subCategory: "U-Bolts",
      image: "https://fixkart-main.vercel.app/fastening/u-bolts.jpg",
      knownType: true,
    };
  }
  if (hay.includes("stud")) {
    return {
      productBaseName: "Studs",
      category: "Fastening & Joining",
      subCategory: "Studs",
      image: "https://fixkart-main.vercel.app/fastening/studs.jpg",
      knownType: true,
    };
  }
  if (hay.includes("threaded")) {
    return {
      productBaseName: "Threaded rods",
      category: "Fastening & Joining",
      subCategory: "Threaded Rods",
      image: "https://fixkart-main.vercel.app/fastening/threaded-rods.jpg",
      knownType: true,
    };
  }
  if (hay.includes("anchor")) {
    return {
      productBaseName: "Wedge anchor",
      category: "Fastening & Joining",
      subCategory: "Wedge anchor",
      image: "https://fixkart-main.vercel.app/fastening/anchor.webp",
      knownType: true,
    };
  }

  return {
    productBaseName: "New Product Type",
    category: "",
    subCategory: "",
    image: getAutoImageByType(DEFAULT_SUBCATEGORY),
    knownType: false,
  };
}

async function extractTextWithOcrSpace(fileDataUrl: string) {
  const apiKey = process.env.OCR_SPACE_API_KEY || "helloworld";
  const variants: Array<Record<string, string>> = [
    { OCREngine: "2", isTable: "true", scale: "true" },
    { OCREngine: "2", isTable: "false", scale: "true" },
    { OCREngine: "1", isTable: "true", scale: "true" },
  ];

  let bestText = "";
  let lastError = "";

  for (const variant of variants) {
    const body = new URLSearchParams();
    body.set("base64Image", fileDataUrl);
    body.set("language", "eng");
    body.set("isOverlayRequired", "false");
    body.set("OCREngine", variant.OCREngine);
    body.set("isTable", variant.isTable);
    body.set("scale", variant.scale);

    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!res.ok) {
      lastError = `OCR failed: ${res.status}`;
      continue;
    }

    const payload = (await res.json()) as {
      IsErroredOnProcessing?: boolean;
      ErrorMessage?: string[] | string;
      ParsedResults?: Array<{ ParsedText?: string }>;
    };

    if (payload?.IsErroredOnProcessing) {
      const err = Array.isArray(payload?.ErrorMessage)
        ? payload.ErrorMessage.join(", ")
        : String(payload?.ErrorMessage || "");
      lastError = err || "OCR processing error";
      continue;
    }

    const parsedText = Array.isArray(payload?.ParsedResults)
      ? payload.ParsedResults.map((entry) => String(entry?.ParsedText || "")).join("\n")
      : "";
    const trimmed = parsedText.trim();
    if (trimmed.length > bestText.length) {
      bestText = trimmed;
    }
  }

  if (!bestText) {
    throw new Error(lastError || "OCR returned empty text");
  }
  return bestText;
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
    let overlaySeed: Array<{ size: string; price: number }> = [];
    try {
      text = await extractTextWithOcrSpace(fileDataUrl);
      // extra OCR pass with overlay coordinates for robust table mapping.
      const overlayBody = new URLSearchParams();
      overlayBody.set("base64Image", fileDataUrl);
      overlayBody.set("language", "eng");
      overlayBody.set("isOverlayRequired", "true");
      overlayBody.set("OCREngine", "2");
      overlayBody.set("isTable", "true");
      overlayBody.set("scale", "true");
      const overlayRes = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: process.env.OCR_SPACE_API_KEY || "helloworld",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: overlayBody.toString(),
      });
      if (overlayRes.ok) {
        const overlayPayload = (await overlayRes.json()) as {
          ParsedResults?: Array<{ TextOverlay?: { Lines?: Array<{ Words?: OcrWord[] }> } }>;
        };
        const words =
          overlayPayload?.ParsedResults?.flatMap((r) =>
            (r?.TextOverlay?.Lines || []).flatMap((ln) => ln?.Words || [])
          ) || [];
        overlaySeed = parseTableFromOverlay(words);
      }
    } catch {
      // Keep flow alive for preview screen; UI can still edit/remove before submit.
      text = fileName;
    }
    const profile = inferProductProfile(fileName, text);
    const image = profile.image;
    const lineSeed = parseDiaLengthRateTable(text);
    // Line parser is more stable for clean matrix tables (DIA x LENGTH).
    // Use overlay parser only as fallback when line parser cannot parse enough rows.
    const fractionalTable = hasFractionalSizes(text);
    const seed = fractionalTable
      ? (overlaySeed.length >= 4 ? overlaySeed : lineSeed)
      : (lineSeed.length >= 8 ? lineSeed : overlaySeed);

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
          category: profile.category || "",
          subCategory: profile.subCategory || profile.productBaseName,
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
      requiresCategorySelection: !profile.knownType,
      suggestedType: profile.subCategory || profile.productBaseName,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate listings from file";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
