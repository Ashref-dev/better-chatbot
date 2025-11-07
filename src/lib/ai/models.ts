import "server-only";

import { createOllama } from "ollama-ai-provider-v2";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { LanguageModelV2, openrouter } from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { LanguageModel } from "ai";
import {
  createOpenAICompatibleModels,
  openaiCompatibleModelsSafeParse,
} from "./create-openai-compatiable";
import { ChatModel } from "app-types/chat";
import {
  DEFAULT_FILE_PART_MIME_TYPES,
  OPENAI_FILE_MIME_TYPES,
  GEMINI_FILE_MIME_TYPES,
  ANTHROPIC_FILE_MIME_TYPES,
  XAI_FILE_MIME_TYPES,
} from "./file-support";

const ollama = createOllama({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
});
const groq = createGroq({
  baseURL: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});
const nvidia = createOpenAICompatible({
  name: "Nvidia",
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY,
});

const staticModels = {
  openai: {
    "gpt-4.1": openai("gpt-4.1"),
    "gpt-4.1-mini": openai("gpt-4.1-mini"),
    "o4-mini": openai("o4-mini"),
    o3: openai("o3"),
    "gpt-5-chat": openai("gpt-5-chat-latest"),
    "gpt-5": openai("gpt-5"),
    "gpt-5-mini": openai("gpt-5-mini"),
    "gpt-5-codex": openai("gpt-5-codex"),
    "gpt-5-nano": openai("gpt-5-nano"),
  },
  google: {
    "gemini-2.5-flash-lite": google("gemini-2.5-flash-lite"),
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gemini-2.5-pro": google("gemini-2.5-pro"),
  },
  anthropic: {
    "sonnet-4.5": anthropic("claude-sonnet-4-5"),
    "haiku-4.5": anthropic("claude-haiku-4-5"),
    "opus-4.1": anthropic("claude-opus-4-1"),
  },
  xai: {
    "grok-4-fast": xai("grok-4-fast-non-reasoning"),
    "grok-4": xai("grok-4"),
    "grok-3": xai("grok-3"),
    "grok-3-mini": xai("grok-3-mini"),
  },
  ollama: {
    "gemma3:1b": ollama("gemma3:1b"),
    "gemma3:4b": ollama("gemma3:4b"),
    "gemma3:12b": ollama("gemma3:12b"),
  },
  groq: {
    "kimi-k2-instruct": groq("moonshotai/kimi-k2-instruct"),
    "llama-4-scout-17b": groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    "gpt-oss-20b": groq("openai/gpt-oss-20b"),
    "gpt-oss-120b": groq("openai/gpt-oss-120b"),
    "qwen3-32b": groq("qwen/qwen3-32b"),
  },
  openRouter: {
    "qwen3-coder:free": openrouter("qwen/qwen3-coder:free"),
    "deepseek-v3.1:free": openrouter("deepseek/deepseek-chat-v3.1:free"),
  },
  nvidia: {
    "deepseek-v3.1": nvidia("deepseek-ai/deepseek-v3.1"),
    "deepseek-v3.1-terminus": nvidia("deepseek-ai/deepseek-v3.1-terminus"),
    "minimax-m2": nvidia("minimaxai/minimax-m2"),
    "kimi-k2-instruct": nvidia("moonshotai/kimi-k2-instruct-0905"),
    "qwen3-next-80b-thinking": nvidia("qwen/qwen3-next-80b-a3b-thinking"),
    "qwen3-coder-480b": nvidia("qwen/qwen3-coder-480b-a35b-instruct"),
    "gpt-oss-120b": nvidia("openai/gpt-oss-120b"),
    "seed-oss-36b": nvidia("bytedance/seed-oss-36b-instruct"),
  },
};

const staticUnsupportedModels = new Set([
  staticModels.openai["o4-mini"],
  staticModels.ollama["gemma3:1b"],
  staticModels.ollama["gemma3:4b"],
  staticModels.ollama["gemma3:12b"],
  staticModels.openRouter["deepseek-v3.1:free"],
]);

const staticSupportImageInputModels = {
  ...staticModels.google,
  ...staticModels.xai,
  ...staticModels.openai,
  ...staticModels.anthropic,
};

const staticFilePartSupportByModel = new Map<
  LanguageModel,
  readonly string[]
>();

const registerFileSupport = (
  model: LanguageModel | undefined,
  mimeTypes: readonly string[] = DEFAULT_FILE_PART_MIME_TYPES,
) => {
  if (!model) return;
  staticFilePartSupportByModel.set(model, Array.from(mimeTypes));
};

registerFileSupport(staticModels.openai["gpt-4.1"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openai["gpt-4.1-mini"],
  OPENAI_FILE_MIME_TYPES,
);
registerFileSupport(staticModels.openai["gpt-5"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["gpt-5-mini"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.openai["gpt-5-nano"], OPENAI_FILE_MIME_TYPES);

registerFileSupport(
  staticModels.google["gemini-2.5-flash-lite"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-2.5-flash"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-2.5-pro"],
  GEMINI_FILE_MIME_TYPES,
);

registerFileSupport(
  staticModels.anthropic["sonnet-4.5"],
  ANTHROPIC_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.anthropic["opus-4.1"],
  ANTHROPIC_FILE_MIME_TYPES,
);

registerFileSupport(staticModels.xai["grok-4-fast"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-4"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-3"], XAI_FILE_MIME_TYPES);
registerFileSupport(staticModels.xai["grok-3-mini"], XAI_FILE_MIME_TYPES);

const openaiCompatibleProviders = openaiCompatibleModelsSafeParse(
  process.env.OPENAI_COMPATIBLE_DATA,
);

const {
  providers: openaiCompatibleModels,
  unsupportedModels: openaiCompatibleUnsupportedModels,
} = createOpenAICompatibleModels(openaiCompatibleProviders);

const allModels = { ...openaiCompatibleModels, ...staticModels };

const allUnsupportedModels = new Set([
  ...openaiCompatibleUnsupportedModels,
  ...staticUnsupportedModels,
]);

export const isToolCallUnsupportedModel = (model: LanguageModel) => {
  return allUnsupportedModels.has(model);
};

const isImageInputUnsupportedModel = (model: LanguageModelV2) => {
  return !Object.values(staticSupportImageInputModels).includes(model);
};

export const getFilePartSupportedMimeTypes = (model: LanguageModel) => {
  return staticFilePartSupportByModel.get(model) ?? [];
};

const fallbackModel = staticModels.openai["gpt-4.1"];

export const customModelProvider = {
  modelsInfo: Object.entries(allModels).map(([provider, models]) => ({
    provider,
    models: Object.entries(models).map(([name, model]) => ({
      name,
      isToolCallUnsupported: isToolCallUnsupportedModel(model),
      isImageInputUnsupported: isImageInputUnsupportedModel(model),
      supportedFileMimeTypes: [...getFilePartSupportedMimeTypes(model)],
    })),
    hasAPIKey: checkProviderAPIKey(provider as keyof typeof staticModels),
  })),
  getModel: (
    model?: ChatModel,
    customOpenRouterModelId?: string,
  ): LanguageModel => {
    if (!model) return fallbackModel;

    // Handle custom OpenRouter models
    if (model.provider === "openRouter" && customOpenRouterModelId) {
      return openrouter(customOpenRouterModelId);
    }

    return allModels[model.provider]?.[model.model] || fallbackModel;
  },
};

function checkProviderAPIKey(provider: keyof typeof staticModels) {
  let key: string | undefined;
  switch (provider) {
    case "openai":
      key = process.env.OPENAI_API_KEY;
      break;
    case "google":
      key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      break;
    case "anthropic":
      key = process.env.ANTHROPIC_API_KEY;
      break;
    case "xai":
      key = process.env.XAI_API_KEY;
      break;
    case "groq":
      key = process.env.GROQ_API_KEY;
      break;
    case "ollama":
      // Ollama typically runs locally (no API key) but may be configured via
      // OLLAMA_BASE_URL or an optional OLLAMA_API_KEY. Only consider Ollama
      // available when one of these is set.
      key = process.env.OLLAMA_BASE_URL || process.env.OLLAMA_API_KEY;
      break;
    case "openRouter":
      key = process.env.OPENROUTER_API_KEY;
      break;
    case "nvidia":
      key = process.env.NVIDIA_API_KEY;
      break;
    default:
      return true; // assume the provider has an API key
  }
  return !!key && key != "****";
}
