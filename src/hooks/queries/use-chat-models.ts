import { appStore } from "@/app/store";
import { fetcher } from "lib/utils";
import useSWR, { SWRConfiguration } from "swr";
import { useEffect, useState } from "react";
import { customOpenRouterModelsManager } from "@/lib/ai/custom-openrouter-models";

export const useChatModels = (options?: SWRConfiguration) => {
  const [customModels, setCustomModels] = useState(
    customOpenRouterModelsManager.getAll(),
  );

  useEffect(() => {
    const handleCustomModelsChange = () => {
      setCustomModels(customOpenRouterModelsManager.getAll());
    };

    window.addEventListener(
      "openrouter-models-changed",
      handleCustomModelsChange,
    );
    return () => {
      window.removeEventListener(
        "openrouter-models-changed",
        handleCustomModelsChange,
      );
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

  // Merge custom OpenRouter models with the API data
  const dataWithCustomModels = result.data?.map((providerInfo) => {
    if (providerInfo.provider === "openRouter" && customModels.length > 0) {
      const customModelEntries = customModels.map((model) => ({
        name: model.displayName,
        isToolCallUnsupported: !model.supportsTools,
        isImageInputUnsupported: true,
        supportedFileMimeTypes: [],
      }));

      return {
        ...providerInfo,
        models: [...providerInfo.models, ...customModelEntries],
      };
    }
    return providerInfo;
  });

  return {
    ...result,
    data: dataWithCustomModels,
  };
};
