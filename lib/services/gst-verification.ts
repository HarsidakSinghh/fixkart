type VerifyResult = {
  ok: boolean;
  status: string;
  error?: string;
  raw?: unknown;
  data?: {
    gstNumber: string;
    legalName: string | null;
    tradeName: string | null;
    businessAddress: string | null;
    businessState: string | null;
    businessPincode: string | null;
  };
};

const LEGAL_NAME_KEYS = [
  "legal_name",
  "legalname",
  "lgnm",
  "taxpayer_name",
  "business_name",
  "name",
];

const TRADE_NAME_KEYS = [
  "trade_name",
  "tradename",
  "trdnm",
  "tradeNam",
  "tradeName",
  "business_trade_name",
];

const ADDRESS_KEYS = [
  "principal_address",
  "business_address",
  "principal_place_of_business",
  "address",
  "pradr",
  "addr",
];

const STATE_KEYS = ["state", "state_name", "state_code", "stj", "stcd"];
const PINCODE_KEYS = ["pincode", "pin", "pncd", "zip"];

function toUpperTrim(value: unknown) {
  return String(value || "").trim().toUpperCase();
}

function asText(value: unknown): string | null {
  const text = String(value || "").trim();
  return text ? text : null;
}

function getByPaths(obj: unknown, paths: string[]) {
  for (const path of paths) {
    const value = path.split(".").reduce<unknown>((acc, key) => {
      if (acc == null || typeof acc !== "object") return undefined;
      return (acc as Record<string, unknown>)[key];
    }, obj);
    if (value != null && value !== "") {
      return value;
    }
  }
  return null;
}

function normalizeKey(value: string) {
  return value.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function flattenAddress(value: unknown): string | null {
  if (typeof value === "string") return asText(value);
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const nestedAddr =
    (obj.addr && typeof obj.addr === "object" ? (obj.addr as Record<string, unknown>) : null) ||
    (obj.address && typeof obj.address === "object" ? (obj.address as Record<string, unknown>) : null);
  const addrObj = nestedAddr || obj;
  const parts = [
    addrObj.floor,
    addrObj.flno,
    addrObj.bno,
    addrObj.bnm,
    addrObj.st,
    addrObj.loc,
    addrObj.dst,
    addrObj.city,
    addrObj.lt,
    addrObj.lg,
    addrObj.state,
    addrObj.stcd,
    addrObj.pncd,
    addrObj.pincode,
  ]
    .map((v) => asText(v))
    .filter(Boolean) as string[];
  if (!parts.length) return null;
  return parts.join(", ");
}

function deepFindByKeys(input: unknown, keys: string[]): unknown {
  const wanted = new Set(keys.map(normalizeKey));
  const queue: unknown[] = [input];
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    const obj = current as Record<string, unknown>;

    for (const [k, v] of Object.entries(obj)) {
      if (wanted.has(normalizeKey(k)) && v != null && v !== "") {
        return v;
      }
      if (v && typeof v === "object") queue.push(v);
    }
  }
  return null;
}

function normalizePayload(payload: unknown, requestedGstin: string) {
  const payloadObj = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const rootCandidate = payloadObj.data ?? payloadObj.result ?? payloadObj.results ?? payloadObj;
  const rootObj =
    rootCandidate && typeof rootCandidate === "object"
      ? (rootCandidate as Record<string, unknown>)
      : {};
  const root = (rootObj.taxpayerInfo as unknown) ?? rootObj;
  const gstNumber = toUpperTrim(
    deepFindByKeys(root, ["gstin", "gst_number", "gstNo", "gst_no", "gst"])
  ) || requestedGstin;

  const rawAddress = deepFindByKeys(root, ADDRESS_KEYS);

  return {
    gstNumber,
    legalName: asText(deepFindByKeys(root, LEGAL_NAME_KEYS)),
    tradeName: asText(deepFindByKeys(root, TRADE_NAME_KEYS)),
    businessAddress: flattenAddress(rawAddress) || asText(getByPaths(root, ["pradr.addr"])) || null,
    businessState: asText(deepFindByKeys(root, STATE_KEYS)),
    businessPincode: asText(deepFindByKeys(root, PINCODE_KEYS)),
  };
}

export function isValidGstin(gst: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(toUpperTrim(gst));
}

export async function verifyGstinWithAppyFlow(inputGstin: string): Promise<VerifyResult> {
  const gstin = toUpperTrim(inputGstin);
  if (!gstin) {
    return { ok: false, status: "NOT_PROVIDED", error: "GSTIN not provided" };
  }
  if (!isValidGstin(gstin)) {
    return { ok: false, status: "INVALID_FORMAT", error: "Invalid GSTIN format" };
  }

  const keySecret = process.env.APPYFLOW_KEY_SECRET;
  const verifyUrl = process.env.APPYFLOW_GST_VERIFY_URL || "https://appyflow.in/api/verifyGST";

  if (!keySecret) {
    return { ok: false, status: "NOT_CONFIGURED", error: "Missing APPYFLOW_KEY_SECRET" };
  }

  const attempts: Array<{ url: string; init: RequestInit }> = [
    {
      url: verifyUrl,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          key_secret: keySecret,
        },
        body: JSON.stringify({ gstNo: gstin }),
      },
    },
    {
      url: verifyUrl,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ gstNo: gstin, key_secret: keySecret }),
      },
    },
    {
      url: `${verifyUrl}${verifyUrl.includes("?") ? "&" : "?"}gstNo=${encodeURIComponent(gstin)}&key_secret=${encodeURIComponent(
        keySecret
      )}`,
      init: { method: "GET" },
    },
  ];

  let lastError = "AppyFlow GST verification failed";

  for (const attempt of attempts) {
    try {
      const res = await fetch(attempt.url, {
        ...attempt.init,
        cache: "no-store",
      });

      const text = await res.text();
      let payload: unknown = null;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        payload = { rawText: text };
      }

      const payloadObj =
        payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};

      if (!res.ok) {
        lastError = String(payloadObj.error || payloadObj.message || `HTTP ${res.status}`);
        continue;
      }

      if (payloadObj.error === true || String(payloadObj.error).toLowerCase() === "true") {
        lastError = String(payloadObj.message || payloadObj.error || "Verification unsuccessful");
        continue;
      }

      if (payloadObj.success === false) {
        lastError = String(payloadObj.message || payloadObj.error || "Verification unsuccessful");
        continue;
      }

      const data = normalizePayload(payload, gstin);
      const hasUsefulDetails =
        Boolean(data.legalName) || Boolean(data.tradeName) || Boolean(data.businessAddress);
      return {
        ok: true,
        status: hasUsefulDetails ? "VERIFIED" : "VERIFIED_NO_DETAILS",
        raw: payload,
        data,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Request failed";
    }
  }

  return {
    ok: false,
    status: "FAILED",
    error: lastError,
  };
}

export function isLikelyNameMatch(submittedName?: string | null, legalName?: string | null, tradeName?: string | null) {
  const left = toUpperTrim(submittedName);
  const legal = toUpperTrim(legalName);
  const trade = toUpperTrim(tradeName);
  if (!left) return null;
  if (!legal && !trade) return null;
  return [legal, trade].some((v) => v && (v.includes(left) || left.includes(v)));
}

export function isLikelyAddressMatch(submittedAddress?: string | null, fetchedAddress?: string | null) {
  const left = toUpperTrim(submittedAddress);
  const right = toUpperTrim(fetchedAddress);
  if (!left || !right) return null;
  return left.includes(right) || right.includes(left);
}
