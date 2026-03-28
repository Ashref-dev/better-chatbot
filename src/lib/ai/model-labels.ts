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
  "gpt-5.2-chat": { label: "GPT 5.2", badge: "chat" },
  "gpt-5.2": { label: "GPT 5.2" },
  "gpt-5.1-chat": { label: "GPT 5.1", badge: "chat" },
  "gpt-5.1-codex": { label: "GPT 5.1", badge: "codex" },
  "gpt-5.1-codex-mini": { label: "GPT 5.1", badge: "codex mini" },
  "gpt-5.1": { label: "GPT 5.1" },
  "gpt-5": { label: "GPT 5" },
  "gpt-5-mini": { label: "GPT 5", badge: "mini" },
  "gpt-5-nano": { label: "GPT 5", badge: "nano" },
  "gpt-4.1": { label: "GPT 4.1" },
  "gpt-4.1-mini": { label: "GPT 4.1", badge: "mini" },
  "o4-mini": { label: "o4", badge: "mini" },
  o3: { label: "o3" },

  // Google
  "gemini-2.5-flash-lite": { label: "Gemini 2.5", badge: "flash lite" },
  "gemini-2.5-flash": { label: "Gemini 2.5", badge: "flash" },
  "gemini-3-pro": { label: "Gemini 3", badge: "pro" },
  "gemini-2.5-pro": { label: "Gemini 2.5", badge: "pro" },

  // Anthropic
  "sonnet-4.5": { label: "Claude 4.5", badge: "sonnet" },
  "haiku-4.5": { label: "Claude 4.5", badge: "haiku" },
  "opus-4.5": { label: "Claude 4.5", badge: "opus" },

  // xAI
  "grok-4-1-fast": { label: "Grok 4.1", badge: "fast" },
  "grok-4-1": { label: "Grok 4.1" },
  "grok-3-mini": { label: "Grok 3", badge: "mini" },

  // Ollama
  "gemma3:1b": { label: "Gemma 3", badge: "1b" },
  "gemma3:4b": { label: "Gemma 3", badge: "4b" },
  "gemma3:12b": { label: "Gemma 3", badge: "12b" },

  // Groq
  "kimi-k2-instruct": { label: "Kimi K2", badge: "instruct" },
  "llama-4-scout-17b": { label: "Llama 4", badge: "scout" },
  "gpt-oss-20b": { label: "GPT OSS", badge: "20b" },
  "gpt-oss-120b": { label: "GPT OSS", badge: "120b" },
  "qwen3-32b": { label: "Qwen 3", badge: "32b" },

  // OpenRouter
  "glm-4.5-air": { label: "GLM 4.5", badge: "air" },
  "minimax-m2.5": { label: "MiniMax M2.5" },
  "trinity-mini": { label: "Trinity", badge: "mini" },
  "trinity-large": { label: "Trinity", badge: "large" },

  // NVIDIA (using full model IDs as keys)
  "deepseek-ai/deepseek-v3.1": { label: "DeepSeek", badge: "v3.1" },
  "deepseek-ai/deepseek-v3.2": { label: "DeepSeek", badge: "v3.2" },
  "moonshotai/kimi-k2-instruct-0905": { label: "Kimi K2", badge: "instruct" },
  "moonshotai/kimi-k2-thinking": { label: "Kimi K2", badge: "thinking" },
  "qwen/qwen3-next-80b-a3b-thinking": { label: "Qwen 3", badge: "next" },
  "qwen/qwen3-coder-480b-a35b-instruct": { label: "Qwen 3", badge: "coder" },
  "openai/gpt-oss-120b": { label: "GPT OSS", badge: "120b" },
  "bytedance/seed-oss-36b-instruct": { label: "Seed OSS", badge: "36b" },
  "mistralai/devstral-2-123b-instruct-2512": {
    label: "Devstral 2",
    badge: "123b",
  },
  "mistralai/mistral-large-3-675b-instruct-2512": {
    label: "Mistral 3",
    badge: "large",
  },
  "nvidia/nemotron-3-super-120b-a12b": { label: "Nemotron 3", badge: "super" },
  "nvidia/nemotron-nano-12b-v2-vl": { label: "Nemotron", badge: "nano" },
  "mistralai/mistral-small-4-119b-2603": { label: "Mistral 4", badge: "small" },
  "qwen/qwen3.5-122b-a10b": { label: "Qwen 3.5", badge: "122b" },
  "qwen/qwen3.5-397b-a17b": { label: "Qwen 3.5", badge: "397b" },
  "stepfun-ai/step-3.5-flash": { label: "Step 3.5", badge: "flash" },
  "z-ai/glm4.7": { label: "GLM 4.7" },
  "z-ai/glm5": { label: "GLM 5" },

  // UncloseAI
  "qwen3-coder-30b": { label: "Qwen 3", badge: "30b" },
  "hermes-3-8b": { label: "Hermes 3", badge: "8b" },
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

// Extract a readable label from model IDs like "openai/gpt-5" or "deepseek-ai/deepseek-v3.1"
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
