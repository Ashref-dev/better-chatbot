import "server-only";

import type { UserPreferences } from "app-types/user";
import { decrypt } from "lib/encryption";
import {
  type DiscoveredModel,
  type ModelDiscoveryProvider,
  type ModelDiscoveryResponse,
} from "./model-discovery-types";

type DiscoveryAuth = "bearer" | "api-key-query" | "anthropic" | "none";

type DiscoveryRequest = {
  label: string;
  url: string;
  auth: DiscoveryAuth;
  idPrefix?: string;
};

type DiscoveryProviderConfig = {
  requests: DiscoveryRequest[];
  envKey?: string;
  fixedKey?: string;
};

type JsonRecord = Record<string, unknown>;

export class ModelDiscoveryError extends Error {
  constructor(
    message: string,
    public readonly status = 502,
    public readonly code = "DISCOVERY_FAILED",
  ) {
    super(message);
    this.name = "ModelDiscoveryError";
  }
}

const OPEN_CODE_ZEN_BASE_URL = "https://opencode.ai/zen/v1";
const OPEN_CODE_GO_BASE_URL = "https://opencode.ai/zen/go/v1";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function configuredBaseUrl(
  value: string | undefined,
  fallback: string,
  providerLabel: string,
): string {
  const baseUrl = trimTrailingSlash(value || fallback);

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new ModelDiscoveryError(
      `${providerLabel} has an invalid configured base URL.`,
      500,
      "INVALID_PROVIDER_CONFIGURATION",
    );
  }

  return baseUrl;
}

function modelsEndpoint(baseUrl: string): string {
  return `${trimTrailingSlash(baseUrl)}/models`;
}

function tagsEndpoint(baseUrl: string): string {
  return `${trimTrailingSlash(baseUrl)}/tags`;
}

function getProviderConfig(
  provider: ModelDiscoveryProvider,
): DiscoveryProviderConfig {
  switch (provider) {
    case "openRouter":
      return {
        requests: [
          {
            label: "OpenRouter",
            url: "https://openrouter.ai/api/v1/models",
            auth: "bearer",
          },
        ],
        envKey: "OPENROUTER_API_KEY",
      };
    case "openCode":
      return {
        requests: [
          {
            label: "OpenCode Zen",
            url: `${OPEN_CODE_ZEN_BASE_URL}/models`,
            auth: "bearer",
          },
          {
            label: "OpenCode Go",
            url: `${OPEN_CODE_GO_BASE_URL}/models`,
            auth: "bearer",
            idPrefix: "opencode-go/",
          },
        ],
        envKey: "OPENCODE_API_KEY",
      };
    case "nvidia":
      return {
        requests: [
          {
            label: "NVIDIA",
            url: "https://integrate.api.nvidia.com/v1/models",
            auth: "bearer",
          },
        ],
        envKey: "NVIDIA_API_KEY",
      };
    case "groq":
      return {
        requests: [
          {
            label: "Groq",
            url: modelsEndpoint(
              configuredBaseUrl(
                process.env.GROQ_BASE_URL,
                "https://api.groq.com/openai/v1",
                "Groq",
              ),
            ),
            auth: "bearer",
          },
        ],
        envKey: "GROQ_API_KEY",
      };
    case "openai":
      return {
        requests: [
          {
            label: "OpenAI",
            url: "https://api.openai.com/v1/models",
            auth: "bearer",
          },
        ],
        envKey: "OPENAI_API_KEY",
      };
    case "google":
      return {
        requests: [
          {
            label: "Google",
            url: "https://generativelanguage.googleapis.com/v1beta/models",
            auth: "api-key-query",
          },
        ],
        envKey: "GOOGLE_GENERATIVE_AI_API_KEY",
      };
    case "anthropic":
      return {
        requests: [
          {
            label: "Anthropic",
            url: "https://api.anthropic.com/v1/models",
            auth: "anthropic",
          },
        ],
        envKey: "ANTHROPIC_API_KEY",
      };
    case "xai":
      return {
        requests: [
          {
            label: "xAI",
            url: "https://api.x.ai/v1/models",
            auth: "bearer",
          },
        ],
        envKey: "XAI_API_KEY",
      };
    case "ollama":
      return {
        requests: [
          {
            label: "Ollama",
            url: tagsEndpoint(
              configuredBaseUrl(
                process.env.OLLAMA_BASE_URL,
                "http://localhost:11434/api",
                "Ollama",
              ),
            ),
            auth: "none",
          },
        ],
      };
    case "hermesai":
      return {
        requests: [
          {
            label: "HermesAI",
            url: "https://hermes.ai.unturf.com/v1/models",
            auth: "bearer",
          },
        ],
        fixedKey: "dummy-api-key",
      };
  }
}

function getEnvironmentKey(envKey?: string): string | undefined {
  return envKey ? process.env[envKey] : undefined;
}

function resolveApiKey(
  provider: ModelDiscoveryProvider,
  config: DiscoveryProviderConfig,
  preferences: UserPreferences | null,
): string | undefined {
  const encryptedUserKey = preferences?.apiKeys?.[provider];
  if (encryptedUserKey) {
    try {
      return decrypt(encryptedUserKey);
    } catch {
      throw new ModelDiscoveryError(
        "The saved provider key could not be decrypted. Please save it again in API Keys.",
        500,
        "INVALID_SAVED_KEY",
      );
    }
  }

  return config.fixedKey ?? getEnvironmentKey(config.envKey);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(...values: unknown[]): string | undefined {
  return values.find(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
}

function modelRecords(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) {
    return payload.filter(isRecord);
  }

  if (!isRecord(payload)) return [];

  for (const key of ["data", "models"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value.filter(isRecord);
  }

  return [];
}

function normalizeModelId(id: string, idPrefix?: string): string {
  const withoutGooglePrefix = id.startsWith("models/") ? id.slice(7) : id;
  if (!idPrefix || withoutGooglePrefix.startsWith(idPrefix)) {
    return withoutGooglePrefix;
  }
  return `${idPrefix}${withoutGooglePrefix}`;
}

type ModelNormalizationOptions = {
  idPrefix?: string;
};

export function parseDiscoveredModels(
  payload: unknown,
  options: ModelNormalizationOptions = {},
): DiscoveredModel[] {
  const models = modelRecords(payload)
    .map((record) => {
      const rawId = firstString(
        record.id,
        record.name,
        record.model,
        record.model_id,
      );
      if (!rawId) return null;

      const id = normalizeModelId(rawId, options.idPrefix);
      const rawName = firstString(
        record.display_name,
        record.displayName,
        record.name,
      );
      const name = rawName && rawName !== rawId ? rawName : undefined;
      const contextLength = [
        record.context_length,
        record.contextLength,
        record.context_window,
        record.inputTokenLimit,
      ].find((value): value is number => typeof value === "number");

      return {
        id,
        ...(name ? { name } : {}),
        ...(typeof record.owned_by === "string"
          ? { ownedBy: record.owned_by }
          : {}),
        ...(contextLength !== undefined ? { contextLength } : {}),
      } satisfies DiscoveredModel;
    })
    .filter((model): model is DiscoveredModel => model !== null);

  const unique = new Map<string, DiscoveredModel>();
  for (const model of models) {
    const existing = unique.get(model.id);
    unique.set(model.id, existing ? { ...model, ...existing } : model);
  }
  return Array.from(unique.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function responseMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) return fallback;

  const error = isRecord(payload.error) ? payload.error : undefined;
  return (
    firstString(error?.message, payload.message, payload.detail) ?? fallback
  );
}

function redactMessage(message: string, apiKey?: string): string {
  return apiKey ? message.replaceAll(apiKey, "[redacted]") : message;
}

async function fetchProviderModels(
  request: DiscoveryRequest,
  apiKey: string | undefined,
): Promise<DiscoveredModel[]> {
  const url = new URL(request.url);
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "better-chatbot-model-discovery/1.0",
  };

  if (request.auth === "bearer") {
    if (!apiKey) {
      throw new ModelDiscoveryError(
        "This provider needs an API key. Add one in API Keys, then try again.",
        400,
        "MISSING_API_KEY",
      );
    }
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (request.auth === "api-key-query") {
    if (!apiKey) {
      throw new ModelDiscoveryError(
        "This provider needs an API key. Add one in API Keys, then try again.",
        400,
        "MISSING_API_KEY",
      );
    }
    url.searchParams.set("key", apiKey);
  }

  if (request.auth === "anthropic") {
    if (!apiKey) {
      throw new ModelDiscoveryError(
        "This provider needs an API key. Add one in API Keys, then try again.",
        400,
        "MISSING_API_KEY",
      );
    }
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  }

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.text();
  let payload: unknown = body;

  try {
    payload = JSON.parse(body);
  } catch {
    // Keep the text response for a useful provider error below.
  }

  if (!response.ok) {
    throw new ModelDiscoveryError(
      redactMessage(
        responseMessage(
          payload,
          `${request.label} returned HTTP ${response.status}.`,
        ),
        apiKey,
      ),
      response.status === 429 ? 429 : 502,
      response.status === 401 || response.status === 403
        ? "PROVIDER_AUTH_FAILED"
        : "PROVIDER_REQUEST_FAILED",
    );
  }

  const models = parseDiscoveredModels(payload, {
    idPrefix: request.idPrefix,
  });
  if (models.length === 0) {
    throw new ModelDiscoveryError(
      `${request.label} returned no recognizable models.`,
      502,
      "INVALID_PROVIDER_RESPONSE",
    );
  }

  return models;
}

export async function discoverModels(
  provider: ModelDiscoveryProvider,
  preferences: UserPreferences | null,
): Promise<ModelDiscoveryResponse> {
  const config = getProviderConfig(provider);
  const apiKey = resolveApiKey(provider, config, preferences);
  const results = await Promise.allSettled(
    config.requests.map((request) => fetchProviderModels(request, apiKey)),
  );
  const models: DiscoveredModel[] = [];
  const warnings: string[] = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      models.push(...result.value);
      return;
    }

    const request = config.requests[index];
    const message =
      result.reason instanceof Error
        ? result.reason.message
        : `${request.label} could not be reached.`;

    warnings.push(message);
  });

  const uniqueModels = new Map<string, DiscoveredModel>();
  for (const model of models) uniqueModels.set(model.id, model);

  if (uniqueModels.size === 0 && warnings.length > 0) {
    const firstFailure = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    throw firstFailure?.reason instanceof ModelDiscoveryError
      ? firstFailure.reason
      : new ModelDiscoveryError(warnings[0]);
  }

  return {
    provider,
    models: Array.from(uniqueModels.values()).sort((a, b) =>
      a.id.localeCompare(b.id),
    ),
    ...(warnings.length > 0 ? { warnings } : {}),
  };
}
