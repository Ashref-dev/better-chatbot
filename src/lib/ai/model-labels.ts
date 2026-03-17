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

  // NVIDIA
  "deepseek-v3.1": { label: "DeepSeek", badge: "v3.1" },
  "deepseek-v3.2": { label: "DeepSeek", badge: "v3.2" },
  "kimi-k2-thinking": { label: "Kimi K2", badge: "thinking" },
  "qwen3-next-80b-thinking": { label: "Qwen 3", badge: "next" },
  "qwen3-coder-480b": { label: "Qwen 3", badge: "coder" },
  "seed-oss-36b": { label: "Seed OSS", badge: "36b" },
  "devstral-2-123b": { label: "Devstral 2", badge: "123b" },
  "mistral-large-3-675b": { label: "Mistral 3", badge: "large" },
  "nemotron-3-super-120b": { label: "Nemotron 3", badge: "super" },
  "nemotron-nano-12b-v2-vl": { label: "Nemotron", badge: "nano" },
  "mistral-small-4-119b": { label: "Mistral 4", badge: "small" },
  "qwen3.5-122b": { label: "Qwen 3.5", badge: "122b" },
  "qwen3.5-397b": { label: "Qwen 3.5" },
  "step-3.5-flash": { label: "Step 3.5", badge: "flash" },
  "glm4.7": { label: "GLM 4.7" },
  glm5: { label: "GLM 5" },

  // UncloseAI
  "qwen3-coder-30b": { label: "Qwen 3", badge: "30b" },
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

  return {
    label: rawModel,
    source: "fallback",
  };
};
