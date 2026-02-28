const DEFAULT_PUBLIC_ASSET_BASE = "";
const LEGACY_ASSET_HOSTS = new Set([
  "fixkart-main.vercel.app",
  "fixkart-8p38.vercel.app",
]);
const CATALOG_PATH_PREFIXES = [
  "/fastening/",
  "/abrasive/",
  "/power-tools/",
  "/handtools/",
  "/electrical/",
  "/office-supplies/",
  "/building&grounds/",
  "/heating&cooling/",
];
const FALLBACK_IMAGE_PATH = "/mobile-placeholder.png";

function isCatalogPath(pathname: string) {
  const lower = String(pathname || "").toLowerCase();
  return CATALOG_PATH_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function getAssetBaseUrl(fallbackBase?: string) {
  const raw =
    process.env.MOBILE_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    fallbackBase ||
    DEFAULT_PUBLIC_ASSET_BASE;
  return String(raw || DEFAULT_PUBLIC_ASSET_BASE).replace(/\/+$/, "");
}

export function normalizeMobileImageUrl(input: unknown, fallbackBase?: string) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (/^data:/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) {
    const absoluteUrl = raw.replace(/\\/g, "/");
    const assetBaseUrl = getAssetBaseUrl(fallbackBase);
    if (!assetBaseUrl) return absoluteUrl;
    try {
      const parsed = new URL(absoluteUrl);
      if (!LEGACY_ASSET_HOSTS.has(parsed.hostname)) return absoluteUrl;
      const base = new URL(assetBaseUrl);
      if (isCatalogPath(parsed.pathname)) {
        return `${base.origin}${FALLBACK_IMAGE_PATH}`;
      }
      return `${base.origin}${encodeURI(parsed.pathname)}${parsed.search}${parsed.hash}`;
    } catch {
      return absoluteUrl;
    }
  }

  const cleaned = raw.replace(/\\/g, "/");
  const normalizedPath = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  const assetBaseUrl = getAssetBaseUrl(fallbackBase);
  if (isCatalogPath(normalizedPath)) {
    return assetBaseUrl ? `${assetBaseUrl}${FALLBACK_IMAGE_PATH}` : FALLBACK_IMAGE_PATH;
  }
  return assetBaseUrl ? `${assetBaseUrl}${encodeURI(normalizedPath)}` : encodeURI(normalizedPath);
}

export function normalizeMobileImageList(input: unknown, fallbackBase?: string) {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => normalizeMobileImageUrl(value, fallbackBase))
    .filter(Boolean);
}
