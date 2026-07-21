import type { LanguageModelV2 } from "@ai-sdk/provider";
import { describe, expect, it, vi } from "vitest";
import { withReasoningEffortFallback } from "./reasoning-effort-fallback";

vi.mock("server-only", () => ({}));

describe("reasoning effort fallback", () => {
  it("retries without reasoning effort when the provider rejects it", async () => {
    const calls: Parameters<LanguageModelV2["doStream"]>[0][] = [];
    const model: LanguageModelV2 = {
      specificationVersion: "v2",
      provider: "openai",
      modelId: "gpt-5.6-sol",
      supportedUrls: {},
      async doGenerate() {
        throw new Error("not used by this test");
      },
      async doStream(options) {
        calls.push(options);
        if (calls.length === 1) {
          throw Object.assign(
            new Error("Unsupported parameter: reasoning_effort"),
            { statusCode: 400 },
          );
        }

        return { stream: new ReadableStream() };
      },
    };

    const wrappedModel = withReasoningEffortFallback(model, {
      providerOptionKey: "openai",
      efforts: ["minimal", "low", "medium", "high"],
    }) as LanguageModelV2;

    await wrappedModel.doStream({
      prompt: [],
      providerOptions: {
        openai: { reasoningEffort: "high" },
        unrelated: { enabled: true },
      },
    });

    expect(calls).toHaveLength(2);
    expect(calls[1].providerOptions).toEqual({
      unrelated: { enabled: true },
    });
  });
});
