"use client";

import {
  ModelLabelOverridesMap,
  getModelLabelOverrideKey,
} from "./model-label-overrides";

export type ResolvedModelDisplay = {
  label: string;
  badge?: string;
  source: "override" | "suggested" | "fallback";
};

type SuggestionRule = {
  test: RegExp;
  label: string;
  variants: string[];
};

const SUGGESTION_RULES: SuggestionRule[] = [
  {
    test: /gpt[-_ ]?5(?:\.|_)?2/i,
    label: "GPT 5.2",
    variants: ["chat", "codex", "mini", "nano", "pro", "latest"],
  },
  {
    test: /gpt[-_ ]?5(?:\.|_)?1/i,
    label: "GPT 5.1",
    variants: ["chat", "codex", "mini", "nano", "pro", "latest"],
  },
  {
    test: /gpt[-_ ]?5/i,
    label: "GPT 5",
    variants: ["chat", "codex", "mini", "nano", "pro", "latest"],
  },
  {
    test: /gpt[-_ ]?4(?:\.|_)?1/i,
    label: "GPT 4.1",
    variants: ["mini", "nano", "preview", "latest"],
  },
  {
    test: /gpt[-_ ]?4o/i,
    label: "GPT 4o",
    variants: ["mini", "audio", "realtime", "preview", "latest"],
  },
  {
    test: /gpt[-_ ]?oss[-_ ]?120b/i,
    label: "GPT OSS",
    variants: ["120b", "instruct"],
  },
  {
    test: /gpt[-_ ]?oss[-_ ]?20b/i,
    label: "GPT OSS",
    variants: ["20b", "instruct"],
  },
  {
    test: /qwen[-_ ]?3/i,
    label: "Qwen 3",
    variants: ["next", "coder", "thinking", "instruct", "mini", "max"],
  },
  {
    test: /qwen[-_ ]?2(?:\.|_)?5/i,
    label: "Qwen 2.5",
    variants: ["coder", "instruct", "mini", "max"],
  },
  {
    test: /deepseek/i,
    label: "DeepSeek",
    variants: ["r1", "v3.2", "v3.1", "v3", "coder", "lite", "chat"],
  },
  {
    test: /claude[-_ ]?4(?:\.|_)?5|sonnet[-_ ]?4(?:\.|_)?5|haiku[-_ ]?4(?:\.|_)?5|opus[-_ ]?4(?:\.|_)?5/i,
    label: "Claude 4.5",
    variants: ["sonnet", "haiku", "opus"],
  },
  {
    test: /claude[-_ ]?3(?:\.|_)?7/i,
    label: "Claude 3.7",
    variants: ["sonnet", "opus", "haiku"],
  },
  {
    test: /claude[-_ ]?3(?:\.|_)?5/i,
    label: "Claude 3.5",
    variants: ["sonnet", "opus", "haiku"],
  },
  {
    test: /gemini[-_ ]?3/i,
    label: "Gemini 3",
    variants: ["pro", "flash", "thinking", "lite", "preview"],
  },
  {
    test: /gemini[-_ ]?2(?:\.|_)?5/i,
    label: "Gemini 2.5",
    variants: ["flash", "pro", "thinking", "lite"],
  },
  {
    test: /grok[-_ ]?4(?:\.|_)?1/i,
    label: "Grok 4.1",
    variants: ["fast", "thinking", "mini"],
  },
  {
    test: /grok[-_ ]?4/i,
    label: "Grok 4",
    variants: ["fast", "thinking", "mini"],
  },
  {
    test: /grok[-_ ]?3/i,
    label: "Grok 3",
    variants: ["mini", "fast", "thinking"],
  },
  {
    test: /llama[-_ ]?4/i,
    label: "Llama 4",
    variants: ["scout", "maverick", "instruct"],
  },
  {
    test: /mistral[-_ ]?large[-_ ]?3/i,
    label: "Mistral Large 3",
    variants: ["instruct", "mini"],
  },
  {
    test: /devstral[-_ ]?2/i,
    label: "Devstral 2",
    variants: ["instruct", "mini"],
  },
  {
    test: /gemma[-_ ]?3/i,
    label: "Gemma 3",
    variants: ["1b", "4b", "12b", "27b", "it"],
  },
  {
    test: /kimi[-_ ]?k2/i,
    label: "Kimi K2",
    variants: ["thinking", "instruct", "chat", "lite"],
  },
  {
    test: /glm[-_ ]?4(?:\.|_)?5/i,
    label: "GLM 4.5",
    variants: ["air", "instruct", "chat"],
  },
  {
    test: /minimax[-_ ]?m2/i,
    label: "MiniMax M2",
    variants: ["thinking", "instruct", "chat"],
  },
  {
    test: /seed[-_ ]?oss[-_ ]?36b/i,
    label: "Seed OSS",
    variants: ["36b", "instruct"],
  },
  {
    test: /nemotron[-_ ]?3/i,
    label: "Nemotron 3",
    variants: ["nano", "30b", "instruct"],
  },
  {
    test: /o3/i,
    label: "o3",
    variants: ["mini", "high", "medium", "low"],
  },
  {
    test: /o4/i,
    label: "o4",
    variants: ["mini", "high", "medium", "low"],
  },
];

const toTokenList = (value: string) => {
  return value
    .toLowerCase()
    .split(/[/:._\-\s]+/)
    .filter(Boolean);
};

const pickVariant = (model: string, variants: string[]) => {
  const tokens = toTokenList(model);
  const exact = variants.find((variant) => tokens.includes(variant));
  if (exact) return exact;

  const joined = model.toLowerCase();
  return variants.find((variant) => joined.includes(variant));
};

export const getSuggestedModelDisplay = (
  model: string,
): Pick<ResolvedModelDisplay, "label" | "badge"> | null => {
  const rawModel = model.trim();
  if (!rawModel) return null;

  const rule = SUGGESTION_RULES.find((item) => item.test.test(rawModel));
  if (!rule) return null;

  const variant = pickVariant(rawModel, rule.variants);
  return {
    label: rule.label,
    badge: variant,
  };
};

export const resolveModelDisplay = (
  provider: string | undefined,
  model: string | undefined,
  overrides: ModelLabelOverridesMap = {},
): ResolvedModelDisplay => {
  const rawModel = model?.trim() || "";
  if (!rawModel) {
    return {
      label: "model",
      source: "fallback",
    };
  }

  const override = provider
    ? overrides[getModelLabelOverrideKey(provider, rawModel)]
    : undefined;

  const suggested = getSuggestedModelDisplay(rawModel);

  const overrideLabel = override?.label?.trim();
  const overrideBadge = override?.badge?.trim();

  if (overrideLabel || overrideBadge) {
    return {
      label: overrideLabel || suggested?.label || rawModel,
      badge: overrideBadge, // Fixed: use exactly what's in override if present
      source: "override",
    };
  }

  if (suggested) {
    return {
      ...suggested,
      source: "suggested",
    };
  }

  return {
    label: rawModel,
    source: "fallback",
  };
};
