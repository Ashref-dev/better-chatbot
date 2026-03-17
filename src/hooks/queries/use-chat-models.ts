import { appStore } from "@/app/store";
import { fetcher } from "lib/utils";
import useSWR, { SWRConfiguration } from "swr";
import { useEffect, useState } from "react";
import { customModelsManager } from "@/lib/ai/custom-models";

export const useChatModels = (options?: SWRConfiguration) => {
  const [customModels, setCustomModels] = useState(
    customModelsManager.getAll(),
  );

  useEffect(() => {
    const handleChange = () => {
      setCustomModels(customModelsManager.getAll());
    };

    window.addEventListener("custom-models-changed", handleChange);
    // Keep legacy event for backward compat
    window.addEventListener("openrouter-models-changed", handleChange);
    return () => {
      window.removeEventListener("custom-models-changed", handleChange);
      window.removeEventListener("openrouter-models-changed", handleChange);
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
    if (providerCustom.length === 0) return providerInfo;

    const customModelEntries = providerCustom.map((model) => ({
      name: model.modelId,
      isToolCallUnsupported: !model.supportsTools,
      isImageInputUnsupported: true,
      supportedFileMimeTypes: [] as string[],
    }));

    return {
      ...providerInfo,
      models: [...providerInfo.models, ...customModelEntries],
    };
  });

  return {
    ...result,
    data: dataWithCustomModels,
  };
};
