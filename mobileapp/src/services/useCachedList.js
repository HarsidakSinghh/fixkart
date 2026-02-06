import { useCallback, useEffect, useState } from "react";
import { getCache, setCache } from "./cache";

export function useCachedList(cacheKey, fetcher, initial = [], ttlMs = 60000) {
  const cached = getCache(cacheKey);
  const [items, setItems] = useState(cached || initial);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await fetcher();
      setItems(data);
      setCache(cacheKey, data, ttlMs);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [cacheKey, fetcher, ttlMs]);

  useEffect(() => {
    if (cached) {
      refresh(true);
    } else {
      refresh();
    }
  }, [refresh]);

  return { items, setItems, loading, error, refresh };
}
