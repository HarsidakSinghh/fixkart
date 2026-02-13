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

function normalizePayload(payload: unknown, requestedGstin: string) {
  const payloadObj = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
  const root = payloadObj.data ?? payloadObj.result ?? payloadObj.results ?? payloadObj;
  const gstNumber = toUpperTrim(
    getByPaths(root, ["gstin", "gst_number", "gstNo", "gst_no", "gst"])
  ) || requestedGstin;

  return {
    gstNumber,
    legalName: asText(getByPaths(root, ["legal_name", "lgnm", "taxpayer_name", "name"])),
    tradeName: asText(getByPaths(root, ["trade_name", "tradeNam", "tradeName"])),
    businessAddress: asText(
      getByPaths(root, [
        "principal_address",
        "business_address",
        "address",
        "pradr.addr.bno",
        "pradr.addr",
      ])
    ),
    businessState: asText(getByPaths(root, ["state", "state_code", "stj", "pradr.addr.stcd"])),
    businessPincode: asText(getByPaths(root, ["pincode", "pradr.addr.pncd"])),
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

      if (payloadObj.success === false) {
        lastError = String(payloadObj.message || payloadObj.error || "Verification unsuccessful");
        continue;
      }

      const data = normalizePayload(payload, gstin);
      return {
        ok: true,
        status: "VERIFIED",
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
