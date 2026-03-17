import useSWR from "swr";
import { useCallback } from "react";

type ApiKeyInfo = Record<string, { hasKey: boolean; preview: string }>;

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useApiKeys() {
  const { data, error, isLoading, mutate } = useSWR<ApiKeyInfo>(
    "/api/user/api-keys",
    fetcher,
  );

  const saveKey = useCallback(
    async (provider: string, apiKey: string) => {
      await fetch("/api/user/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      await mutate();
    },
    [mutate],
  );

  const removeKey = useCallback(
    async (provider: string) => {
      const updated = { ...data };
      delete updated[provider];
      await mutate(updated, false);
      await fetch("/api/user/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      await mutate();
    },
    [data, mutate],
  );

  return { apiKeys: data ?? {}, isLoading, error, saveKey, removeKey };
}
