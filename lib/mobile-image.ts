const DEFAULT_PUBLIC_ASSET_BASE = "https://fixkart-main.vercel.app";

function getAssetBaseUrl() {
  const raw =
    process.env.MOBILE_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_PUBLIC_ASSET_BASE;
  return String(raw || DEFAULT_PUBLIC_ASSET_BASE).replace(/\/+$/, "");
}

export function normalizeMobileImageUrl(input: unknown) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (/^data:/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\\/g, "/");

  const cleaned = raw.replace(/\\/g, "/");
  const normalizedPath = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return `${getAssetBaseUrl()}${encodeURI(normalizedPath)}`;
}

export function normalizeMobileImageList(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => normalizeMobileImageUrl(value))
    .filter(Boolean);
}
