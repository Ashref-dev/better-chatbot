import useSWR from "swr";
import { useCallback } from "react";
import { getStorageManager } from "@/lib/browser-stroage";

const hiddenModelsStorage = getStorageManager<string[]>("hidden-models");
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useHiddenModels() {
  const { data, error, isLoading, mutate } = useSWR<string[]>(
    "/api/user/hidden-models",
    fetcher,
    {
      onSuccess: (data) => {
        hiddenModelsStorage.set(data);
      },
    },
  );

  const hiddenModels = data ?? [];

  const toggleModel = useCallback(
    async (key: string) => {
      const current = data ?? [];
      const updated = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      hiddenModelsStorage.set(updated);
      await mutate(updated, false);
      await fetch("/api/user/hidden-models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      await mutate();
      window.dispatchEvent(new Event("hidden-models-changed"));
    },
    [data, mutate],
  );

  const resetToDefaults = useCallback(async () => {
    hiddenModelsStorage.set([]);
    await mutate([], false);
    await fetch("/api/user/hidden-models", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    });
    await mutate();
    window.dispatchEvent(new Event("hidden-models-changed"));
  }, [mutate]);

  const isHidden = useCallback(
    (key: string) => hiddenModels.includes(key),
    [hiddenModels],
  );

  return {
    hiddenModels,
    isLoading,
    error,
    toggleModel,
    resetToDefaults,
    isHidden,
  };
}
