import "server-only";

import type { LanguageModelV2 } from "@ai-sdk/provider";
import { type LanguageModel, wrapLanguageModel } from "ai";
import type { ReasoningEffortSupport } from "./reasoning-effort";

function isReasoningEffortRejected(error: unknown): boolean {
  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? (error as { statusCode?: number }).statusCode
      : undefined;
  const message = error instanceof Error ? error.message : String(error);

  return (
    (statusCode === 400 || statusCode === 422) &&
    /reasoning(?:_|\s|-)?effort|reasoning level|thinking budget/i.test(message)
  );
}

function withoutReasoningEffort(
  params: Parameters<LanguageModelV2["doStream"]>[0],
  providerOptionKey: ReasoningEffortSupport["providerOptionKey"],
) {
  const { [providerOptionKey]: _reasoningOptions, ...providerOptions } =
    params.providerOptions ?? {};

  return {
    ...params,
    providerOptions,
  };
}

export function withReasoningEffortFallback(
  model: LanguageModel,
  support: ReasoningEffortSupport | undefined,
): LanguageModel {
  if (!support) return model;

  return wrapLanguageModel({
    model: model as LanguageModelV2,
    middleware: {
      async wrapGenerate({ doGenerate, model: baseModel, params }) {
        try {
          return await doGenerate();
        } catch (error) {
          if (!isReasoningEffortRejected(error)) throw error;

          return baseModel.doGenerate(
            withoutReasoningEffort(params, support.providerOptionKey),
          );
        }
      },
      async wrapStream({ doStream, model: baseModel, params }) {
        try {
          return await doStream();
        } catch (error) {
          if (!isReasoningEffortRejected(error)) throw error;

          return baseModel.doStream(
            withoutReasoningEffort(params, support.providerOptionKey),
          );
        }
      },
    },
  }) as LanguageModel;
}
