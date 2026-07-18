"use client";

import {
  ModelLabelOverridesMap,
  getModelLabelOverrideKey,
} from "./model-label-overrides";

export type ResolvedModelDisplay = {
  label: string;
  badge?: string;
  source: "override" | "default" | "fallback";
};

// Default display labels for all known models.
// Key = model key as used in staticModels (e.g. "gpt-5.2-chat").
// Users can override any of these per-device via the Model Labels settings.
const DEFAULT_LABELS: Record<string, { label: string; badge?: string }> = {
  // OpenAI
  "gpt-5.6-sol": { label: "GPT 5.6", badge: "sol" },
  "gpt-5.6-terra": { label: "GPT 5.6", badge: "terra" },
  "gpt-5.6-luna": { label: "GPT 5.6", badge: "luna" },
  "gpt-5.5": { label: "GPT 5.5" },
  "gpt-5.4-mini": { label: "GPT 5.4", badge: "mini" },
  "gpt-5.4-nano": { label: "GPT 5.4", badge: "nano" },
  "gpt-4.1": { label: "GPT 4.1" },

  // Google
  "gemini-3.5-flash": { label: "Gemini 3.5", badge: "flash" },
  "gemini-2.5-flash": { label: "Gemini 2.5", badge: "flash" },
  "gemini-3.1-pro": { label: "Gemini 3.1", badge: "pro" },
  "gemini-2.5-pro": { label: "Gemini 2.5", badge: "pro" },
  "gemini-3.1-flash-lite": {
    label: "Gemini 3.1",
    badge: "flash lite",
  },

  // Anthropic
  "claude-sonnet-5": { label: "Claude 5", badge: "sonnet" },
  "claude-haiku-4-5": { label: "Claude 4.5", badge: "haiku" },
  "claude-opus-4-8": { label: "Claude 4.5", badge: "opus" },

  // xAI
  "grok-4.5": { label: "Grok 4.5" },

  // Ollama
  "olmo-3:7b": { label: "Olmo 3", badge: "7B" },
  "gemma3:4b": { label: "Gemma 3", badge: "4B" },
  "lfm2.5-thinking:1.2b": { label: "LFM 2.5", badge: "1.2B" },

  // Groq
  "llama-3.3-70b-versatile": { label: "Llama 3.3", badge: "70B" },
  "llama-4-scout-17b": { label: "Llama 4", badge: "scout" },
  "gpt-oss-120b": { label: "GPT OSS", badge: "120B" },
  "groq/compound": { label: "Compound" },

  // OpenRouter
  "gpt-oss-20B": { label: "GPT OSS", badge: "20B" },
  "poolside/laguna-xs-2.1": { label: "Laguna 2.1", badge: "xs" },
  "google/gemma-4-26b-a4b-it": { label: "Gemma 4", badge: "26B" },

  // NVIDIA (using full model IDs as keys)
  "deepseek-ai/deepseek-v4-flash": { label: "DeepSeek V4", badge: "flash" },
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": {
    label: "Nemotron 3",
    badge: "nano",
  },
  "openai/gpt-oss-120b": { label: "GPT OSS", badge: "120B" },
  "thinkingmachines/inkling": { label: "Inkling" },
  "minimaxai/minimax-m3": { label: "MiniMax M3" },
  "nvidia/nemotron-3-super-120b-a12b": { label: "Nemotron 3", badge: "super" },
  "nvidia/nemotron-3-ultra-550b-a55b": { label: "Nemotron 3", badge: "ultra" },
  "nvidia/nemotron-nano-12b-v2-vl": { label: "Nemotron", badge: "nano" },
  "mistralai/mistral-nemotron": { label: "Mistral", badge: "Nemotron" },
  "mistralai/mistral-small-4-119b-2603": { label: "Mistral 4", badge: "small" },
  "stepfun-ai/step-3.7-flash": { label: "Step 3.7", badge: "flash" },
  "google/gemma-4-31b-it": { label: "Gemma 4", badge: "31B" },
  "google/diffusiongemma-26b-a4b-it": {
    label: "Diffusion Gemma",
    badge: "26B",
  },
  "z-ai/glm-5.2": { label: "GLM 5.2" },

  // HermesAI
  "Lorbus/Qwen3.6-27B-int4-AutoRound": { label: "Qwen 3.6", badge: "27B" },
};

export const getDefaultModelDisplay = (
  model: string,
): Pick<ResolvedModelDisplay, "label" | "badge"> | null => {
  return DEFAULT_LABELS[model.trim()] ?? null;
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

  const defaultDisplay = getDefaultModelDisplay(rawModel);

  const overrideLabel = override?.label?.trim();
  const overrideBadge = override?.badge?.trim();

  if (overrideLabel || overrideBadge) {
    return {
      label: overrideLabel || defaultDisplay?.label || rawModel,
      badge: overrideBadge,
      source: "override",
    };
  }

  if (defaultDisplay) {
    return {
      ...defaultDisplay,
      source: "default",
    };
  }

  // Auto-beautify: extract model name from "org/model-name" format
  const beautified = beautifyModelId(rawModel);
  return {
    label: beautified.label,
    badge: beautified.badge,
    source: "fallback",
  };
};

// Extract a readable label from model IDs like "openai/gpt-5" or "deepseek-ai/deepseek-v3.1-terminus"
function beautifyModelId(modelId: string): { label: string; badge?: string } {
  // Remove org prefix if present (e.g., "openai/gpt-5" -> "gpt-5")
  const withoutOrg = modelId.includes("/")
    ? modelId.split("/").slice(1).join("/")
    : modelId;

  // Split by common delimiters to find version/variant
  const parts = withoutOrg.split(/[-_]/);

  // Try to find version patterns like "v3.1", "3.5", "120b", etc.
  const versionPatterns =
    /^(v?\d+\.?\d*[a-z]?|[0-9]+[bkmgt]b?|alpha|beta|preview|instruct|chat|mini|nano|flash|pro|ultra|lite|fast|turbo|latest|free)$/i;

  let labelParts: string[] = [];
  let badgeParts: string[] = [];
  let foundVersion = false;

  for (const part of parts) {
    if (!foundVersion && versionPatterns.test(part)) {
      foundVersion = true;
    }
    if (foundVersion) {
      badgeParts.push(part);
    } else {
      labelParts.push(part);
    }
  }

  // If no version found, use the whole thing as label
  if (labelParts.length === 0) {
    labelParts = parts;
    badgeParts = [];
  }

  // Capitalize first letter of each word
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const label = labelParts.map(capitalize).join(" ");
  const badge = badgeParts.length > 0 ? badgeParts.join(" ") : undefined;

  return { label, badge };
}
