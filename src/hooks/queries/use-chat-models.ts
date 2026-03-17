import { appStore } from "@/app/store";
import { fetcher } from "lib/utils";
import useSWR, { SWRConfiguration } from "swr";
import { useEffect, useState } from "react";
import { getStorageManager } from "@/lib/browser-stroage";
import { CustomModelEntry } from "app-types/user";

const hiddenModelsStorage = getStorageManager<string[]>("hidden-models");

export const useChatModels = (options?: SWRConfiguration) => {
  // Fetch custom models from DB API
  const { data: customModelsData } = useSWR<CustomModelEntry[]>(
    "/api/user/custom-models",
    fetcher,
    { dedupingInterval: 60_000, revalidateOnFocus: false, fallbackData: [] },
  );
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

  const result = useSWR<
    {
      provider: string;
      hasAPIKey: boolean;
      models: {
        name: string;
        isToolCallUnsupported: boolean;
        isImageInputUnsupported: boolean;
        supportedFileMimeTypes: string[];
      }[];
    }[]
  >("/api/chat/models", fetcher, {
    dedupingInterval: 60_000 * 5,
    revalidateOnFocus: false,
    fallbackData: [],
    onSuccess: (data) => {
      const status = appStore.getState();
      if (!status.chatModel) {
        const firstProvider = data[0].provider;
        const model = data[0].models[0].name;
        appStore.setState({ chatModel: { provider: firstProvider, model } });
      }
    },
    ...options,
  });

  // Merge custom models into their respective providers
  const dataWithCustomModels = result.data?.map((providerInfo) => {
    const providerCustom = customModels.filter(
      (m) => m.provider === providerInfo.provider,
    );

    const allModels =
      providerCustom.length === 0
        ? providerInfo.models
        : [
            ...providerInfo.models,
            ...providerCustom.map((model) => ({
              name: model.modelId,
              isToolCallUnsupported: !model.supportsTools,
              isImageInputUnsupported: true,
              supportedFileMimeTypes: [] as string[],
            })),
          ];

    // Filter out hidden models
    const visibleModels = allModels.filter(
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
