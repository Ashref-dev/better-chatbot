import type { ChatModel, ReasoningEffort } from "app-types/chat";

export const REASONING_EFFORT_LABELS: Record<ReasoningEffort, string> = {
  minimal: "Minimal",
  low: "Low",
  medium: "Medium",
  high: "High",
  xhigh: "Extra high",
};

type ReasoningProviderOptionKey = "openai" | "openai-compatible";

export type ReasoningEffortSupport = {
  providerOptionKey: ReasoningProviderOptionKey;
  efforts: readonly ReasoningEffort[];
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

const INKLING_REASONING_SUPPORT = {
  providerOptionKey: "openai-compatible",
  efforts: ["minimal", "low", "medium", "high", "xhigh"],
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
    model.provider === "nvidia" &&
    model.model === "thinkingmachines/inkling"
  ) {
    return INKLING_REASONING_SUPPORT;
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
  const validatedEffort = getValidatedReasoningEffort(model, effort);

  if (!support || !validatedEffort) return undefined;

  return {
    [support.providerOptionKey]: {
      reasoningEffort: validatedEffort,
    },
  };
}
