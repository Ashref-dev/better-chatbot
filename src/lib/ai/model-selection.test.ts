import { describe, expect, it } from "vitest";
import {
  type ChatModelProvider,
  mergeCustomModelsIntoProviders,
  resolveAvailableChatModel,
} from "./model-selection";

const providers: ChatModelProvider[] = [
  {
    provider: "hermesai",
    hasAPIKey: true,
    models: [
      {
        name: "solidrust/Hermes-3-Llama-3.1-8B-AWQ",
        isToolCallUnsupported: false,
        isImageInputUnsupported: true,
        supportedFileMimeTypes: [],
      },
    ],
  },
  {
    provider: "nvidia",
    hasAPIKey: true,
    models: [
      {
        name: "thinkingmachines/inkling",
        isToolCallUnsupported: false,
        isImageInputUnsupported: false,
        supportedFileMimeTypes: [],
      },
    ],
  },
];

describe("custom model selection", () => {
  it("keeps a persisted custom model instead of falling back", () => {
    const customModels = mergeCustomModelsIntoProviders(providers, [
      {
        provider: "nvidia",
        modelId: "acme/persistent-custom-model",
        supportsTools: true,
      },
    ]);

    expect(
      resolveAvailableChatModel(
        { provider: "nvidia", model: "acme/persistent-custom-model" },
        customModels,
      ),
    ).toEqual({
      provider: "nvidia",
      model: "acme/persistent-custom-model",
    });
  });

  it("falls back when a selected model is genuinely unavailable", () => {
    expect(
      resolveAvailableChatModel(
        { provider: "nvidia", model: "removed-model" },
        providers,
      ),
    ).toEqual({
      provider: "hermesai",
      model: "solidrust/Hermes-3-Llama-3.1-8B-AWQ",
    });
  });
});
