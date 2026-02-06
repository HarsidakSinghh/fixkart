const cacheStore = new Map();

export function getCache(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < Date.now()) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

export function setCache(key, value, ttlMs = 60000) {
  cacheStore.set(key, {
    value,
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
  });
}

export function clearCache(keyPrefix) {
  if (!keyPrefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(keyPrefix)) cacheStore.delete(key);
  }
}
