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

  it("enables GPT OSS reasoning levels through OpenRouter and NVIDIA", () => {
    const support = {
      providerOptionKey: "openai-compatible",
      efforts: ["low", "medium", "high"],
    };

    expect(
      getReasoningEffortSupport({
        provider: "openRouter",
        model: "openai/gpt-oss-20b:free",
      }),
    ).toEqual(support);
    expect(
      getReasoningEffortSupport({
        provider: "nvidia",
        model: "openai/gpt-oss-120b",
      }),
    ).toEqual(support);
    expect(
      getReasoningProviderOptions(
        { provider: "openRouter", model: "openai/gpt-oss-20b:free" },
        "high",
      ),
    ).toEqual({
      "openai-compatible": { reasoningEffort: "high" },
    });
  });

  it("enables Inkling's extra-high reasoning level through NVIDIA", () => {
    expect(
      getReasoningEffortSupport({
        provider: "nvidia",
        model: "thinkingmachines/inkling",
      }),
    ).toEqual({
      providerOptionKey: "openai-compatible",
      efforts: ["none", "minimal", "low", "medium", "high", "xhigh"],
    });
    expect(
      getReasoningProviderOptions(
        { provider: "nvidia", model: "thinkingmachines/inkling" },
        "xhigh",
      ),
    ).toEqual({
      "openai-compatible": { reasoningEffort: "xhigh" },
    });
  });

  it("supports DeepSeek V4's none/high reasoning switch", () => {
    const model = {
      provider: "nvidia",
      model: "deepseek-ai/deepseek-v4-flash",
    };

    expect(getReasoningEffortSupport(model)).toEqual({
      providerOptionKey: "openai-compatible",
      efforts: ["none", "high"],
      defaultEffort: "none",
    });
    expect(getReasoningProviderOptions(model, undefined)).toEqual({
      "openai-compatible": { reasoningEffort: "none" },
    });
    expect(getReasoningProviderOptions(model, "high")).toEqual({
      "openai-compatible": { reasoningEffort: "high" },
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

  it("maps MiniMax M3 reasoning to the documented thinking mode", () => {
    const model = {
      provider: "nvidia",
      model: "minimaxai/minimax-m3",
    };

    expect(getReasoningEffortSupport(model)).toEqual({
      providerOptionKey: "openai-compatible",
      efforts: ["none", "on"],
      optionMode: "thinking-mode",
    });
    expect(getReasoningProviderOptions(model, "none")).toEqual({
      "openai-compatible": {
        chat_template_kwargs: { thinking_mode: "disabled" },
      },
    });
    expect(getReasoningProviderOptions(model, "on")).toEqual({
      "openai-compatible": {
        chat_template_kwargs: { thinking_mode: "enabled" },
      },
    });
  });

  it("maps Diffusion Gemma reasoning to the thinking toggle", () => {
    const model = {
      provider: "nvidia",
      model: "google/diffusiongemma-26b-a4b-it",
    };

    expect(getReasoningEffortSupport(model)).toEqual({
      providerOptionKey: "openai-compatible",
      efforts: ["none", "on"],
      optionMode: "thinking-toggle",
    });
    expect(getReasoningProviderOptions(model, undefined)).toEqual({
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
