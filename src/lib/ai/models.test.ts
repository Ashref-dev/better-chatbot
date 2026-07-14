import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  GEMINI_FILE_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
  ANTHROPIC_FILE_MIME_TYPES,
} from "./file-support";

vi.mock("server-only", () => ({}));

let modelsModule: typeof import("./models");

beforeAll(async () => {
  modelsModule = await import("./models");
});

describe("customModelProvider file support metadata", () => {
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

  it("keeps NVIDIA models tool-call supported", () => {
    const { customModelProvider, isToolCallUnsupportedModel } = modelsModule;

    const nvidiaProvider = customModelProvider.modelsInfo.find(
      (item) => item.provider === "nvidia",
    );

    expect(nvidiaProvider).toBeDefined();

    const qwen122b = nvidiaProvider?.models.find(
      (item) => item.name === "qwen/qwen3.5-122b-a10b",
    );
    const qwen397b = nvidiaProvider?.models.find(
      (item) => item.name === "qwen/qwen3.5-122b-a10b",
    );

    expect(qwen122b?.isToolCallUnsupported).toBe(false);
    expect(qwen397b?.isToolCallUnsupported).toBe(false);

    const qwen122bModel = customModelProvider.getModel({
      provider: "nvidia",
      model: "qwen/qwen3.5-122b-a10b",
    });
    const qwen397bModel = customModelProvider.getModel({
      provider: "nvidia",
      model: "qwen/qwen3.5-122b-a10b",
    });

    expect(isToolCallUnsupportedModel(qwen122bModel)).toBe(false);
    expect(isToolCallUnsupportedModel(qwen397bModel)).toBe(false);
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
