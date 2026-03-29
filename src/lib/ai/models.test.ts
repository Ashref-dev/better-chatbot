import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  OPENAI_FILE_MIME_TYPES,
  ANTHROPIC_FILE_MIME_TYPES,
} from "./file-support";

vi.mock("server-only", () => ({}));

let modelsModule: typeof import("./models");

beforeAll(async () => {
  modelsModule = await import("./models");
});

describe("customModelProvider file support metadata", () => {
  it("includes default file support for OpenAI gpt-5.2-chat", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "openai",
      model: "gpt-5.2-chat",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(OPENAI_FILE_MIME_TYPES),
    );

    const openaiProvider = customModelProvider.modelsInfo.find(
      (item) => item.provider === "openai",
    );
    const metadata = openaiProvider?.models.find(
      (item) => item.name === "gpt-5.2-chat",
    );

    expect(metadata?.supportedFileMimeTypes).toEqual(
      Array.from(OPENAI_FILE_MIME_TYPES),
    );
  });

  it("adds rich support for anthropic sonnet-4.5", () => {
    const { customModelProvider, getFilePartSupportedMimeTypes } = modelsModule;
    const model = customModelProvider.getModel({
      provider: "anthropic",
      model: "sonnet-4.5",
    });
    expect(getFilePartSupportedMimeTypes(model)).toEqual(
      Array.from(ANTHROPIC_FILE_MIME_TYPES),
    );
  });

  it("keeps NVIDIA Qwen 3.5 models tool-call supported", () => {
    const { customModelProvider, isToolCallUnsupportedModel } = modelsModule;

    const nvidiaProvider = customModelProvider.modelsInfo.find(
      (item) => item.provider === "nvidia",
    );

    expect(nvidiaProvider).toBeDefined();

    const qwen122b = nvidiaProvider?.models.find(
      (item) => item.name === "qwen/qwen3.5-122b-a10b",
    );
    const qwen397b = nvidiaProvider?.models.find(
      (item) => item.name === "qwen/qwen3.5-397b-a17b",
    );

    expect(qwen122b?.isToolCallUnsupported).toBe(false);
    expect(qwen397b?.isToolCallUnsupported).toBe(false);

    const qwen122bModel = customModelProvider.getModel({
      provider: "nvidia",
      model: "qwen/qwen3.5-122b-a10b",
    });
    const qwen397bModel = customModelProvider.getModel({
      provider: "nvidia",
      model: "qwen/qwen3.5-397b-a17b",
    });

    expect(isToolCallUnsupportedModel(qwen122bModel)).toBe(false);
    expect(isToolCallUnsupportedModel(qwen397bModel)).toBe(false);
  });
});
