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

  it("enables Nemotron Ultra's none, medium, and high levels", () => {
    const model = {
      provider: "nvidia",
      model: "nvidia/nemotron-3-ultra-550b-a55b",
    };

    expect(getReasoningEffortSupport(model)).toEqual({
      providerOptionKey: "openai-compatible",
      efforts: ["none", "medium", "high"],
    });
    expect(getReasoningProviderOptions(model, "none")).toEqual({
      "openai-compatible": { reasoningEffort: "none" },
    });
  });

  it("enables Nemotron Super's none, low, and high levels", () => {
    const model = {
      provider: "nvidia",
      model: "nvidia/nemotron-3-super-120b-a12b",
    };

    expect(getReasoningEffortSupport(model)).toEqual({
      providerOptionKey: "openai-compatible",
      efforts: ["none", "low", "high"],
    });
    expect(getReasoningProviderOptions(model, "low")).toEqual({
      "openai-compatible": { reasoningEffort: "low" },
    });
  });

  it("maps Nemotron 3 Nano reasoning to the thinking toggle", () => {
    const model = {
      provider: "nvidia",
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    };

    expect(getReasoningEffortSupport(model)).toEqual({
      providerOptionKey: "openai-compatible",
      efforts: ["none", "on"],
      optionMode: "thinking-toggle",
    });
    expect(getReasoningProviderOptions(model, "none")).toEqual({
      "openai-compatible": {
        chat_template_kwargs: { enable_thinking: false },
      },
    });
    expect(getReasoningProviderOptions(model, "on")).toEqual({
      "openai-compatible": {
        chat_template_kwargs: { enable_thinking: true },
      },
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
        { provider: "nvidia", model: "mistralai/mistral-nemotron" },
        "high",
      ),
    ).toBeUndefined();
  });
});
