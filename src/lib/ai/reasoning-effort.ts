import type { ChatModel, ReasoningEffort } from "app-types/chat";

export const REASONING_EFFORT_LABELS: Record<ReasoningEffort, string> = {
  none: "None",
  on: "On",
  minimal: "Minimal",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
};

type ReasoningProviderOptionKey = "openai" | "openai-compatible";
type ReasoningOptionMode = "effort" | "thinking-toggle" | "thinking-mode";

export type ReasoningEffortSupport = {
  providerOptionKey: ReasoningProviderOptionKey;
  efforts: readonly ReasoningEffort[];
  optionMode?: ReasoningOptionMode;
  defaultEffort?: ReasoningEffort;
};

const OPENAI_REASONING_MODEL_IDS = new Set([
  "gpt-5.6-sol",
  "gpt-5.6-terra",
  "gpt-5.6-luna",
  "gpt-5.5",
  "gpt-5.4-mini",
  "gpt-5.4-nano",
  "gpt-4.1",
]);

const OPENAI_REASONING_SUPPORT = {
  providerOptionKey: "openai",
  efforts: ["minimal", "low", "medium", "high"],
} as const satisfies ReasoningEffortSupport;

const GPT_OSS_REASONING_SUPPORT = {
  providerOptionKey: "openai-compatible",
  efforts: ["low", "medium", "high"],
} as const satisfies ReasoningEffortSupport;

const INKLING_REASONING_SUPPORT = {
  providerOptionKey: "openai-compatible",
  efforts: ["none", "minimal", "low", "medium", "high", "xhigh"],
} as const satisfies ReasoningEffortSupport;

const DEEPSEEK_V4_REASONING_SUPPORT = {
  providerOptionKey: "openai-compatible",
  efforts: ["none", "high"],
  defaultEffort: "none",
} as const satisfies ReasoningEffortSupport;

const NEMOTRON_ULTRA_REASONING_SUPPORT = {
  providerOptionKey: "openai-compatible",
  efforts: ["none", "medium", "high"],
} as const satisfies ReasoningEffortSupport;

const NEMOTRON_SUPER_REASONING_SUPPORT = {
  providerOptionKey: "openai-compatible",
  efforts: ["none", "low", "high"],
} as const satisfies ReasoningEffortSupport;

const NEMOTRON_3_NANO_REASONING_SUPPORT = {
  providerOptionKey: "openai-compatible",
  efforts: ["none", "on"],
  optionMode: "thinking-toggle",
} as const satisfies ReasoningEffortSupport;

const DIFFUSION_GEMMA_REASONING_SUPPORT = {
  providerOptionKey: "openai-compatible",
  efforts: ["none", "on"],
  optionMode: "thinking-toggle",
} as const satisfies ReasoningEffortSupport;

const MINIMAX_M3_REASONING_SUPPORT = {
  providerOptionKey: "openai-compatible",
  efforts: ["none", "on"],
  optionMode: "thinking-mode",
} as const satisfies ReasoningEffortSupport;

export function getReasoningEffortSupport(
  model?: ChatModel,
): ReasoningEffortSupport | undefined {
  if (!model) return undefined;

  if (
    model.provider === "openai" &&
    OPENAI_REASONING_MODEL_IDS.has(model.model)
  ) {
    return OPENAI_REASONING_SUPPORT;
  }

  if (
    (model.provider === "openRouter" &&
      model.model === "openai/gpt-oss-20b:free") ||
    (model.provider === "nvidia" && model.model === "openai/gpt-oss-120b")
  ) {
    return GPT_OSS_REASONING_SUPPORT;
  }

  if (
    model.provider === "nvidia" &&
    model.model === "thinkingmachines/inkling"
  ) {
    return INKLING_REASONING_SUPPORT;
  }

  if (
    model.provider === "nvidia" &&
    model.model === "deepseek-ai/deepseek-v4-flash"
  ) {
    return DEEPSEEK_V4_REASONING_SUPPORT;
  }

  if (
    model.provider === "nvidia" &&
    model.model === "nvidia/nemotron-3-ultra-550b-a55b"
  ) {
    return NEMOTRON_ULTRA_REASONING_SUPPORT;
  }

  if (
    model.provider === "nvidia" &&
    model.model === "nvidia/nemotron-3-super-120b-a12b"
  ) {
    return NEMOTRON_SUPER_REASONING_SUPPORT;
  }

  if (
    model.provider === "nvidia" &&
    model.model === "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
  ) {
    return NEMOTRON_3_NANO_REASONING_SUPPORT;
  }

  if (model.provider === "nvidia" && model.model === "minimaxai/minimax-m3") {
    return MINIMAX_M3_REASONING_SUPPORT;
  }

  if (
    model.provider === "nvidia" &&
    model.model === "google/diffusiongemma-26b-a4b-it"
  ) {
    return DIFFUSION_GEMMA_REASONING_SUPPORT;
  }

  return undefined;
}

export function getValidatedReasoningEffort(
  model: ChatModel | undefined,
  effort: ReasoningEffort | undefined,
): ReasoningEffort | undefined {
  const support = getReasoningEffortSupport(model);
  if (!support || !effort) return undefined;

  const requestedIndex = Object.keys(REASONING_EFFORT_LABELS).indexOf(effort);
  const supportedEffort = support.efforts.findLast(
    (candidate) =>
      Object.keys(REASONING_EFFORT_LABELS).indexOf(candidate) <= requestedIndex,
  );

  return supportedEffort ?? support.efforts[0];
}

export function getReasoningProviderOptions(
  model: ChatModel | undefined,
  effort: ReasoningEffort | undefined,
) {
  const support = getReasoningEffortSupport(model);
  const validatedEffort =
    getValidatedReasoningEffort(model, effort) ??
    support?.defaultEffort ??
    (support?.optionMode === "thinking-toggle" ||
    support?.optionMode === "thinking-mode"
      ? "none"
      : undefined);

  if (!support || !validatedEffort) return undefined;

  if (support.optionMode === "thinking-toggle") {
    return {
      [support.providerOptionKey]: {
        chat_template_kwargs: {
          enable_thinking: validatedEffort === "on",
        },
      },
    };
  }

  if (support.optionMode === "thinking-mode") {
    return {
      [support.providerOptionKey]: {
        chat_template_kwargs: {
          thinking_mode: validatedEffort === "none" ? "disabled" : "enabled",
        },
      },
    };
  }

  return {
    [support.providerOptionKey]: {
      reasoningEffort: validatedEffort,
    },
  };
}
