"use client";

import { CustomModelEntry } from "app-types/user";
import { fetcher } from "lib/utils";
import useSWR from "swr";
import { useCallback, useEffect, useRef } from "react";
import { customModelsManager } from "@/lib/ai/custom-models";

const API_URL = "/api/user/custom-models";
const EVENT_NAME = "custom-models-changed";

export function useCustomModels() {
  const migrated = useRef(false);

  const { data, error, isLoading, mutate } = useSWR<CustomModelEntry[]>(
    API_URL,
    fetcher,
    {
      dedupingInterval: 60_000,
      revalidateOnFocus: false,
      fallbackData: [],
    },
  );

  // One-time migration: push localStorage models to DB if DB is empty
  useEffect(() => {
    if (migrated.current || isLoading || !data) return;
    migrated.current = true;

    if (data.length > 0) return; // DB already has models

    const local = customModelsManager.getAll();
    if (local.length === 0) return;

    const entries: CustomModelEntry[] = local.map((m) => ({
      provider: m.provider,
      modelId: m.modelId,
      supportsTools: m.supportsTools,
    }));

    fetch(API_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entries),
    }).then(() => mutate(entries, false));
  }, [data, isLoading, mutate]);

  const models = data ?? [];

  const add = useCallback(
    async (provider: string, modelId: string, supportsTools: boolean) => {
      const exists = models.some(
        (m) => m.provider === provider && m.modelId === modelId,
      );
      if (exists) return false;

      const entry: CustomModelEntry = { provider, modelId, supportsTools };
      const next = [...models, entry];

      // Also update localStorage for the chat-bot.tsx check
      customModelsManager.add(provider, modelId, supportsTools);

      await mutate(
        async () => {
          await fetch(API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
          return next;
        },
        { optimisticData: next, rollbackOnError: true },
      );

      window.dispatchEvent(new Event(EVENT_NAME));
      return true;
    },
    [models, mutate],
  );

  const remove = useCallback(
    async (provider: string, modelId: string) => {
      const next = models.filter(
        (m) => !(m.provider === provider && m.modelId === modelId),
      );

      // Also remove from localStorage
      const local = customModelsManager.getAll();
      const localModel = local.find(
        (m) => m.provider === provider && m.modelId === modelId,
      );
      if (localModel) customModelsManager.remove(localModel.id);

      await mutate(
        async () => {
          await fetch(API_URL, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(next),
          });
          return next;
        },
        { optimisticData: next, rollbackOnError: true },
      );

      window.dispatchEvent(new Event(EVENT_NAME));
    },
    [models, mutate],
  );

  const exists = useCallback(
    (provider: string, modelId: string) =>
      models.some((m) => m.provider === provider && m.modelId === modelId),
    [models],
  );

  return { models, isLoading, error, add, remove, exists, mutate };
}
