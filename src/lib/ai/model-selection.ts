import type { ChatModel, ModelProviderPresentation } from "app-types/chat";
import type { CustomModelEntry } from "app-types/user";

export type ChatModelInfo = {
  name: string;
  isToolCallUnsupported: boolean;
  isImageInputUnsupported: boolean;
  supportedFileMimeTypes: string[];
};

export type ChatModelProvider = {
  provider: string;
  hasAPIKey: boolean;
  presentation?: ModelProviderPresentation;
  models: ChatModelInfo[];
};

export function mergeCustomModelsIntoProviders(
  providers: readonly ChatModelProvider[],
  customModels: readonly CustomModelEntry[],
): ChatModelProvider[] {
  return providers.map((providerInfo) => {
    const builtInModelIds = new Set(
      providerInfo.models.map((model) => model.name),
    );
    const providerCustomModels = customModels
      .filter((model) => model.provider === providerInfo.provider)
      .filter((model) => !builtInModelIds.has(model.modelId))
      .map((model) => ({
        name: model.modelId,
        isToolCallUnsupported: !model.supportsTools,
        isImageInputUnsupported: true,
        supportedFileMimeTypes: [],
      }));

    return {
      ...providerInfo,
      models: [...providerInfo.models, ...providerCustomModels],
    };
  });
}

export function resolveAvailableChatModel(
  selectedModel: ChatModel | undefined,
  providers: readonly ChatModelProvider[],
): ChatModel | undefined {
  const isSelectedModelAvailable = providers.some(
    (provider) =>
      provider.provider === selectedModel?.provider &&
      provider.models.some((model) => model.name === selectedModel.model),
  );

  if (selectedModel && isSelectedModelAvailable) {
    return selectedModel;
  }

  const firstProvider = providers.find(
    (provider) => provider.models.length > 0,
  );
  if (!firstProvider) return undefined;

  return {
    provider: firstProvider.provider,
    model: firstProvider.models[0].name,
  };
}
