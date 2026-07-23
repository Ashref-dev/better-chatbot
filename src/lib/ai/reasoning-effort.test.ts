import { describe, expect, it } from "vitest";
import {
  getReasoningEffortSupport,
  getReasoningProviderOptions,
  getValidatedReasoningEffort,
} from "./reasoning-effort";

describe("reasoning effort support", () => {
  it("enables the supported levels for every listed OpenAI GPT model", () => {
    expect(
      getReasoningEffortSupport({
        provider: "openai",
        model: "gpt-5.6-sol",
      }),
    ).toEqual({
      providerOptionKey: "openai",
      efforts: ["minimal", "low", "medium", "high"],
    });
  });

  it("enables Inkling's extra-high reasoning level through NVIDIA", () => {
    expect(
      getReasoningProviderOptions(
        { provider: "nvidia", model: "thinkingmachines/inkling" },
        "xhigh",
      ),
    ).toEqual({
      "openai-compatible": { reasoningEffort: "xhigh" },
    });
  });

  it("clamps unsupported effort levels and ignores unsupported models", () => {
    expect(
      getValidatedReasoningEffort(
        { provider: "openai", model: "gpt-5.6-sol" },
        "xhigh",
      ),
    ).toBe("high");
    expect(
      getReasoningProviderOptions(
        { provider: "nvidia", model: "mistralai/mistral-small-4-119b-2603" },
        "high",
      ),
    ).toBeUndefined();
  });
});
