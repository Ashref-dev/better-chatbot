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
  it("includes default file support for OpenAI gpt-5.5", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "openai",
      model: "gpt-5.5",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(OPENAI_FILE_MIME_TYPES),
    );

    const openaiProvider = customModelProvider.modelsInfo.find(
      (item) => item.provider === "openai",
    );
    const metadata = openaiProvider?.models.find(
      (item) => item.name === "gpt-5.5",
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

  it("adds file support for Gemini 3.5 Flash", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "google",
      model: "gemini-3.5-flash",
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
    const mistralNemo = nvidiaProvider?.models.find(
      (item) => item.name === "mistralai/mistral-nemotron",
    );

    expect(qwen122b?.isToolCallUnsupported).toBe(false);
    expect(mistralNemo?.isToolCallUnsupported).toBe(false);

    const qwen122bModel = customModelProvider.getModel({
      provider: "nvidia",
      model: "qwen/qwen3.5-122b-a10b",
    });
    const mistralNemoModel = customModelProvider.getModel({
      provider: "nvidia",
      model: "mistralai/mistral-nemotron",
    });

    expect(isToolCallUnsupportedModel(qwen122bModel)).toBe(false);
    expect(isToolCallUnsupportedModel(mistralNemoModel)).toBe(false);
  });

  it("enables image input for the explicitly allowed NVIDIA vision models", () => {
    const { customModelProvider } = modelsModule;

    const nvidiaProvider = customModelProvider.modelsInfo.find(
      (item) => item.provider === "nvidia",
    );

    const visionModels = [
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
      "mistralai/mistral-small-4-119b-2603",
      "mistralai/mistral-medium-3.5-128b",
      "mistralai/mistral-large-3-675b-instruct-2512",
      "google/gemma-4-31b-it",
      "moonshotai/kimi-k2.6",
      "qwen/qwen3.5-122b-a10b",
      "stepfun-ai/step-3.7-flash",
    ];

    for (const modelName of visionModels) {
      const metadata = nvidiaProvider?.models.find(
        (item) => item.name === modelName,
      );
      expect(metadata?.isImageInputUnsupported).toBe(false);
    }
  });

  it("keeps mistral-nemotron non-vision", () => {
    const { customModelProvider } = modelsModule;

    const nvidiaProvider = customModelProvider.modelsInfo.find(
      (item) => item.provider === "nvidia",
    );
    const metadata = nvidiaProvider?.models.find(
      (item) => item.name === "mistralai/mistral-nemotron",
    );

    expect(metadata?.isImageInputUnsupported).toBe(true);
  });
});
