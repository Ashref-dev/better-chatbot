import "server-only";

import { createOllama } from "ollama-ai-provider-v2";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { xai, createXai } from "@ai-sdk/xai";
import {
  LanguageModelV2,
  openrouter,
  createOpenRouter,
} from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  extractReasoningMiddleware,
  type LanguageModel,
  wrapLanguageModel,
} from "ai";
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
const hermesai = createOpenAICompatible({
  name: "hermesai",
  baseURL: "https://hermes.ai.unturf.com/v1",
  apiKey: "dummy-api-key",
});

const HERMES_QWEN_MODEL_ID = "Lorbus/Qwen3.6-27B-int4-AutoRound";
const hermesQwen = wrapLanguageModel({
  model: hermesai(HERMES_QWEN_MODEL_ID),
  middleware: extractReasoningMiddleware({
    tagName: "think",
    startWithReasoning: true,
  }),
});

const staticModels = {
  hermesai: {
    [HERMES_QWEN_MODEL_ID]: hermesQwen,
  },
  openai: {
    "gpt-5.6-sol": openai("gpt-5.6-sol"),
    "gpt-5.6-terra": openai("gpt-5.6-terra"),
    "gpt-5.6-luna": openai("gpt-5.6-luna"),
    "gpt-5.5": openai("gpt-5.5"),
    "gpt-5.4-mini": openai("gpt-5.4-mini"),
    "gpt-5.4-nano": openai("gpt-5.4-nano"),
    "gpt-4.1": openai("gpt-4.1"),
  },
  google: {
    "gemini-3.1-pro": google("gemini-3.1-pro"),
    "gemini-2.5-pro": google("gemini-2.5-pro"),
    "gemini-3.5-flash": google("gemini-3.5-flash"),
    "gemini-2.5-flash": google("gemini-2.5-flash"),
    "gemini-3.1-flash-lite": google("gemini-3.1-flash-lite"),
  },
  anthropic: {
    "claude-sonnet-5": anthropic("claude-sonnet-5"),
    "claude-haiku-4-5": anthropic("claude-haiku-4-5"),
    "claude-opus-4-8": anthropic("claude-opus-4-8"),
  },
  xai: {
    "grok-4.5": xai("grok-4.5"),
  },
  ollama: {
    "olmo-3:7b": ollama("olmo-3:7b"),
    "gemma3:4b": ollama("gemma3:4b"),
    "lfm2.5-thinking:1.2b": ollama("lfm2.5-thinking:1.2b"),
  },
  groq: {
    "llama-3.3-70b-versatile": groq("llama-3.3-70b-versatile"),
    "llama-4-scout-17b": groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    "gpt-oss-120b": groq("openai/gpt-oss-120b"),
    "groq/compound": groq("groq/compound"),
  },
  openRouter: {
    "gpt-oss-20B": openrouter("openai/gpt-oss-20b:free"),
    "poolside/laguna-xs-2.1": openrouter("poolside/laguna-xs-2.1:free"),
    "google/gemma-4-26b-a4b-it": openrouter("google/gemma-4-26b-a4b-it:free"),
  },
  nvidia: {
    "bytedance/seed-oss-36b-instruct": nvidia(
      "bytedance/seed-oss-36b-instruct",
    ),
    "deepseek-ai/deepseek-v4-flash": nvidia("deepseek-ai/deepseek-v4-flash"),
    "deepseek-ai/deepseek-v4-pro": nvidia("deepseek-ai/deepseek-v4-pro"),
    "google/diffusiongemma-26b-a4b-it": nvidia(
      "google/diffusiongemma-26b-a4b-it",
    ),
    "google/gemma-4-31b-it": nvidia("google/gemma-4-31b-it"),
    "minimaxai/minimax-m3": nvidia("minimaxai/minimax-m3"),
    "mistralai/devstral-2-123b-instruct-2512": nvidia(
      "mistralai/devstral-2-123b-instruct-2512",
    ),
    "mistralai/mistral-large-3-675b-instruct-2512": nvidia(
      "mistralai/mistral-large-3-675b-instruct-2512",
    ),
    "mistralai/mistral-nemotron": nvidia("mistralai/mistral-nemotron"),
    "mistralai/mistral-small-4-119b-2603": nvidia(
      "mistralai/mistral-small-4-119b-2603",
    ),
    "mistralai/mistral-medium-3.5-128b": nvidia(
      "mistralai/mistral-medium-3.5-128b",
    ),
    "mistralai/ministral-14b-instruct-2512": nvidia(
      "mistralai/ministral-14b-instruct-2512",
    ),
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning": nvidia(
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    ),
    "nvidia/nemotron-3-super-120b-a12b": nvidia(
      "nvidia/nemotron-3-super-120b-a12b",
    ),
    "nvidia/nemotron-3-ultra-550b-a55b": nvidia(
      "nvidia/nemotron-3-ultra-550b-a55b",
    ),
    "nvidia/nemotron-nano-12b-v2-vl": nvidia("nvidia/nemotron-nano-12b-v2-vl"),
    "openai/gpt-oss-120b": nvidia("openai/gpt-oss-120b"),
    "qwen/qwen3-coder-480b-a35b-instruct": nvidia(
      "qwen/qwen3-coder-480b-a35b-instruct",
    ),
    "qwen/qwen3-next-80b-a3b-instruct": nvidia(
      "qwen/qwen3-next-80b-a3b-instruct",
    ),
    "qwen/qwen3.5-122b-a10b": nvidia("qwen/qwen3.5-122b-a10b"),
    "stepfun-ai/step-3.7-flash": nvidia("stepfun-ai/step-3.7-flash"),
    "z-ai/glm-5.2": nvidia("z-ai/glm-5.2"),
  },
};

const staticUnsupportedModels = new Set([
  staticModels.ollama["olmo-3:7b"],
  staticModels.ollama["gemma3:4b"],
  staticModels.ollama["lfm2.5-thinking:1.2b"],
  // deepseek-v3.1:free removed from OpenRouter (no longer available)
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

registerFileSupport(staticModels.openai["gpt-5.6-sol"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openai["gpt-5.6-terra"],
  OPENAI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.openai["gpt-5.6-luna"],
  OPENAI_FILE_MIME_TYPES,
);
registerFileSupport(staticModels.openai["gpt-5.5"], OPENAI_FILE_MIME_TYPES);
registerFileSupport(
  staticModels.openai["gpt-5.4-mini"],
  OPENAI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.openai["gpt-5.4-nano"],
  OPENAI_FILE_MIME_TYPES,
);
registerFileSupport(staticModels.openai["gpt-4.1"], OPENAI_FILE_MIME_TYPES);

registerFileSupport(
  staticModels.google["gemini-3.5-flash"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-2.5-flash"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-3.1-flash-lite"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-2.5-pro"],
  GEMINI_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.google["gemini-3.1-pro"],
  GEMINI_FILE_MIME_TYPES,
);

registerFileSupport(
  staticModels.anthropic["claude-sonnet-5"],
  ANTHROPIC_FILE_MIME_TYPES,
);
registerFileSupport(
  staticModels.anthropic["claude-opus-4-8"],
  ANTHROPIC_FILE_MIME_TYPES,
);

registerFileSupport(staticModels.xai["grok-4.5"], XAI_FILE_MIME_TYPES);

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

const fallbackModel = staticModels.openai["gpt-5.6-sol"];

// Create a provider model instance, optionally with a user-provided API key
function createProviderModel(
  provider: string,
  modelId: string,
  userApiKey?: string,
): LanguageModel {
  if (userApiKey) {
    switch (provider) {
      case "openai":
        return createOpenAI({ apiKey: userApiKey })(modelId) as LanguageModel;
      case "google":
        return createGoogleGenerativeAI({ apiKey: userApiKey })(
          modelId,
        ) as LanguageModel;
      case "anthropic":
        return createAnthropic({ apiKey: userApiKey })(
          modelId,
        ) as LanguageModel;
      case "xai":
        return createXai({ apiKey: userApiKey })(modelId) as LanguageModel;
      case "groq":
        return createGroq({ apiKey: userApiKey })(modelId) as LanguageModel;
      case "openRouter":
        return createOpenRouter({ apiKey: userApiKey })(
          modelId,
        ) as LanguageModel;
      case "nvidia":
        return createOpenAICompatible({
          name: "Nvidia",
          baseURL: "https://integrate.api.nvidia.com/v1",
          apiKey: userApiKey,
        })(modelId) as LanguageModel;
      case "ollama":
        return createOllama({
          baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/api",
        })(modelId) as LanguageModel;
      default:
        break;
    }
  }

  // Default providers (env-based keys)
  const defaultMap: Record<string, (id: string) => LanguageModel> = {
    openRouter: (id) => openrouter(id) as LanguageModel,
    nvidia: (id) => nvidia(id) as LanguageModel,
    groq: (id) => groq(id) as LanguageModel,
    openai: (id) => openai(id) as LanguageModel,
    google: (id) => google(id) as LanguageModel,
    anthropic: (id) => anthropic(id) as LanguageModel,
    xai: (id) => xai(id) as LanguageModel,
    ollama: (id) => ollama(id) as LanguageModel,
    hermesai: (id) => hermesai(id) as LanguageModel,
  };
  const factory = defaultMap[provider];
  return factory ? factory(modelId) : fallbackModel;
}

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
    customModelId?: string,
    userApiKeys?: Record<string, string>,
  ): LanguageModel => {
    if (!model) return fallbackModel;

    const userKey = userApiKeys?.[model.provider];

    // Custom model ID → always create dynamically
    if (customModelId) {
      return createProviderModel(model.provider, customModelId, userKey);
    }

    // User has their own API key → create provider with that key
    if (userKey) {
      return createProviderModel(model.provider, model.model, userKey);
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
