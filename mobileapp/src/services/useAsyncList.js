import { useCallback, useEffect, useState } from "react";

export function useAsyncList(fetcher, initial = []) {
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetcher();
      setItems(data);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, setItems, loading, error, refresh };
}
