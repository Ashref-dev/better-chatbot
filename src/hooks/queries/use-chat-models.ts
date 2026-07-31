import { appStore } from "@/app/store";
import { getStorageManager } from "@/lib/browser-stroage";
import { CustomModelEntry } from "app-types/user";
import {
  type ChatModelProvider,
  mergeCustomModelsIntoProviders,
  resolveAvailableChatModel,
} from "lib/ai/model-selection";
import { fetcher } from "lib/utils";
import { useEffect, useMemo, useState } from "react";
import useSWR, { SWRConfiguration } from "swr";

const hiddenModelsStorage = getStorageManager<string[]>("hidden-models");

const LEGACY_OPENROUTER_MODEL_IDS: Record<string, string> = {
  "gpt-oss-20B": "openai/gpt-oss-20b:free",
  "poolside/laguna-xs-2.1": "poolside/laguna-xs-2.1:free",
  "google/gemma-4-26b-a4b-it": "google/gemma-4-26b-a4b-it:free",
};

export const useChatModels = (options?: SWRConfiguration) => {
  const [isStoreHydrated, setIsStoreHydrated] = useState(() =>
    appStore.persist.hasHydrated(),
  );

  useEffect(() => {
    if (appStore.persist.hasHydrated()) {
      setIsStoreHydrated(true);
      return;
    }

    return appStore.persist.onFinishHydration(() => {
      setIsStoreHydrated(true);
    });
  }, []);

  // Fetch custom models from DB API
  const { data: customModelsData, isLoading: isCustomModelsLoading } = useSWR<
    CustomModelEntry[]
  >("/api/user/custom-models", fetcher, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
  });
  const customModels = customModelsData ?? [];

  const [hiddenModels, setHiddenModels] = useState<string[]>(
    hiddenModelsStorage.get() ?? [],
  );

  useEffect(() => {
    const handleHiddenChange = () => {
      setHiddenModels(hiddenModelsStorage.get() ?? []);
    };

    window.addEventListener("custom-models-changed", handleHiddenChange);
    window.addEventListener("hidden-models-changed", handleHiddenChange);
    return () => {
      window.removeEventListener("custom-models-changed", handleHiddenChange);
      window.removeEventListener("hidden-models-changed", handleHiddenChange);
    };
  }, []);

  const result = useSWR<ChatModelProvider[]>("/api/chat/models", fetcher, {
    dedupingInterval: 60_000 * 5,
    revalidateOnFocus: false,
    fallbackData: [],
    ...options,
  });

  const providersWithCustomModels = useMemo(
    () => mergeCustomModelsIntoProviders(result.data ?? [], customModels),
    [result.data, customModels],
  );

  useEffect(() => {
    if (!isStoreHydrated || !result.data?.length || isCustomModelsLoading) {
      return;
    }

    const status = appStore.getState();
    const selectedModel = status.chatModel
      ? {
          ...status.chatModel,
          model:
            status.chatModel.provider === "openRouter"
              ? (LEGACY_OPENROUTER_MODEL_IDS[status.chatModel.model] ??
                status.chatModel.model)
              : status.chatModel.model,
        }
      : undefined;
    const resolvedModel = resolveAvailableChatModel(
      selectedModel,
      providersWithCustomModels,
    );

    if (
      resolvedModel &&
      (resolvedModel.provider !== status.chatModel?.provider ||
        resolvedModel.model !== status.chatModel?.model)
    ) {
      appStore.setState({ chatModel: resolvedModel });
    }
  }, [
    isStoreHydrated,
    isCustomModelsLoading,
    providersWithCustomModels,
    result.data,
  ]);

  // Merge custom models into their respective providers
  const dataWithCustomModels = providersWithCustomModels.map((providerInfo) => {
    const visibleModels = providerInfo.models.filter(
      (m) => !hiddenModels.includes(`${providerInfo.provider}:${m.name}`),
    );

    return {
      ...providerInfo,
      models: visibleModels,
    };
  });

  return {
    ...result,
    data: dataWithCustomModels,
  };
};
