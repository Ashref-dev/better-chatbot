import useSWR from "swr";
import { useCallback } from "react";

type ApiKeyInfo = Record<
  string,
  { hasUserKey: boolean; hasEnvKey: boolean; preview: string }
>;

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
      // Optimistically update: keep hasEnvKey, remove hasUserKey and preview
      const updated = { ...data };
      if (updated[provider]) {
        updated[provider] = {
          hasUserKey: false,
          hasEnvKey: updated[provider].hasEnvKey,
          preview: "",
        };
      }
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

  const getKey = useCallback(async (provider: string): Promise<string> => {
    const response = await fetch("/api/user/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    const result = await response.json();
    return result.apiKey || "";
  }, []);

  return { apiKeys: data ?? {}, isLoading, error, saveKey, removeKey, getKey };
}
