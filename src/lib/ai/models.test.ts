import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  ANTHROPIC_FILE_MIME_TYPES,
  GEMINI_FILE_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
} from "./file-support";
import { USER_ALLOWED_CHAT_MODELS } from "./model-access";
import { getReasoningEffortSupport } from "./reasoning-effort";

vi.mock("server-only", () => ({}));

let modelsModule: typeof import("./models");

beforeAll(async () => {
  modelsModule = await import("./models");
});

describe("customModelProvider file support metadata", () => {
  it("contains every model allowed for normal users", () => {
    for (const allowedModel of USER_ALLOWED_CHAT_MODELS) {
      const provider = modelsModule.customModelProvider.modelsInfo.find(
        (item) => item.provider === allowedModel.provider,
      );

      expect(provider?.models.map((model) => model.name)).toContain(
        allowedModel.model,
      );
    }
  });

  it("orders Gemini models by generation, then capability tier", () => {
    const googleProvider = modelsModule.customModelProvider.modelsInfo.find(
      (item) => item.provider === "google",
    );

    expect(googleProvider?.models.map((model) => model.name)).toEqual([
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-3.1-pro",
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
    ]);
  });

  it("enables reasoning effort for every OpenAI GPT model in the catalog", () => {
    const openaiProvider = modelsModule.customModelProvider.modelsInfo.find(
      (item) => item.provider === "openai",
    );

    for (const model of openaiProvider?.models ?? []) {
      expect(
        getReasoningEffortSupport({ provider: "openai", model: model.name }),
      ).toBeDefined();
    }
  });

  it("keeps NVIDIA Mistral models together", () => {
    const nvidiaProvider = modelsModule.customModelProvider.modelsInfo.find(
      (item) => item.provider === "nvidia",
    );
    const modelNames = nvidiaProvider?.models.map((model) => model.name) ?? [];
    const mistralIndices = modelNames
      .map((name, index) => (name.startsWith("mistralai/") ? index : -1))
      .filter((index) => index >= 0);

    expect(mistralIndices).toEqual([4]);
  });

  it("updates the NVIDIA model catalog", () => {
    const nvidiaProvider = modelsModule.customModelProvider.modelsInfo.find(
      (item) => item.provider === "nvidia",
    );
    const modelNames = nvidiaProvider?.models.map((model) => model.name) ?? [];

    expect(modelNames).toContain("thinkingmachines/inkling");
    expect(modelNames).not.toContain("thinkingmachines/inkling-low");
    expect(modelNames).not.toContain("thinkingmachines/inkling-medium");
    expect(modelNames).not.toContain("thinkingmachines/inkling-high");
    expect(modelNames).not.toContain("google/gemma-4-31b-it");
    expect(modelNames).toContain("poolside/laguna-xs-2.1");
    expect(modelNames).not.toContain("qwen/qwen3-coder-480b-a35b-instruct");
  });

  it("includes default file support for OpenAI gpt-5.6-sol", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "openai",
      model: "gpt-5.6-sol",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(OPENAI_FILE_MIME_TYPES),
    );

    const openaiProvider = customModelProvider.modelsInfo.find(
      (item) => item.provider === "openai",
    );
    const metadata = openaiProvider?.models.find(
      (item) => item.name === "gpt-5.6-sol",
    );

    expect(metadata?.supportedFileMimeTypes).toEqual(
      Array.from(OPENAI_FILE_MIME_TYPES),
    );
  });

  it("adds rich support for anthropic sonnet-4.6", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "anthropic",
      model: "sonnet-4.6",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(ANTHROPIC_FILE_MIME_TYPES),
    );
  });

  it("adds file support for Gemini 3.1 Flash Lite", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "google",
      model: "gemini-3.1-flash-lite",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(GEMINI_FILE_MIME_TYPES),
    );
  });

  it("marks NVIDIA models as image-input unsupported by default", () => {
    const { customModelProvider } = modelsModule;

    const nvidiaProvider = customModelProvider.modelsInfo.find(
      (item) => item.provider === "nvidia",
    );

    // NVIDIA models are not in staticSupportImageInputModels
    // so they should all be marked as image-input unsupported
    const nvidiaModels = nvidiaProvider?.models ?? [];
    expect(nvidiaModels.length).toBeGreaterThan(0);

    for (const metadata of nvidiaModels) {
      expect(metadata.isImageInputUnsupported).toBe(true);
    }
  });

  it("marks Google, OpenAI, Anthropic, xAI models as image-input supported", () => {
    const { customModelProvider } = modelsModule;

    const supportedProviders = ["google", "openai", "anthropic", "xai"];
    for (const providerName of supportedProviders) {
      const provider = customModelProvider.modelsInfo.find(
        (item) => item.provider === providerName,
      );
      const models = provider?.models ?? [];
      expect(models.length).toBeGreaterThan(0);

      for (const metadata of models) {
        expect(metadata.isImageInputUnsupported).toBe(false);
      }
    }
  });
});
