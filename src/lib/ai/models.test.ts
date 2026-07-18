import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { streamText } from "ai";
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

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("customModelProvider file support metadata", () => {
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

  it("keeps NVIDIA Mistral models together", () => {
    const nvidiaProvider = modelsModule.customModelProvider.modelsInfo.find(
      (item) => item.provider === "nvidia",
    );
    const modelNames = nvidiaProvider?.models.map((model) => model.name) ?? [];
    const mistralIndices = modelNames
      .map((name, index) => (name.startsWith("mistralai/") ? index : -1))
      .filter((index) => index >= 0);

    expect(mistralIndices).toEqual([6, 7, 8, 9, 10, 11]);
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

describe("Hermes Qwen reasoning", () => {
  it("streams reasoning before the final text response", async () => {
    const chunks = [
      { delta: { role: "assistant", content: "" }, finish_reason: null },
      { delta: { content: "Working it out" }, finish_reason: null },
      { delta: { content: "</think>" }, finish_reason: null },
      { delta: { content: "Final answer" }, finish_reason: null },
      { delta: {}, finish_reason: "stop" },
    ];
    const body = `${chunks
      .map(
        (choice, index) =>
          `data: ${JSON.stringify({
            id: "chatcmpl-test",
            object: "chat.completion.chunk",
            created: index,
            model: "Lorbus/Qwen3.6-27B-int4-AutoRound",
            choices: [{ index: 0, ...choice }],
          })}`,
      )
      .join("\n\n")}\n\ndata: [DONE]\n\n`;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(body, {
          headers: { "content-type": "text/event-stream" },
        }),
      ),
    );

    const model = modelsModule.customModelProvider.getModel({
      provider: "hermesai",
      model: "Lorbus/Qwen3.6-27B-int4-AutoRound",
    });
    const result = streamText({ model, prompt: "test" });
    const order: string[] = [];
    let reasoning = "";
    let answer = "";

    for await (const part of result.fullStream) {
      if (
        ["reasoning-start", "reasoning-end", "text-start", "text-end"].includes(
          part.type,
        )
      ) {
        order.push(part.type);
      }
      if (part.type === "reasoning-delta") reasoning += part.text;
      if (part.type === "text-delta") answer += part.text;
    }

    expect(order).toEqual([
      "reasoning-start",
      "reasoning-end",
      "text-start",
      "text-end",
    ]);
    expect(reasoning).toBe("Working it out");
    expect(answer).toBe("Final answer");
  });
});
