export const MODEL_DISCOVERY_PROVIDERS = [
  { key: "openRouter", label: "OpenRouter" },
  { key: "openCode", label: "OpenCode" },
  { key: "nvidia", label: "NVIDIA" },
  { key: "groq", label: "Groq" },
  { key: "openai", label: "OpenAI" },
  { key: "google", label: "Google" },
  { key: "anthropic", label: "Anthropic" },
  { key: "xai", label: "xAI" },
  { key: "ollama", label: "Ollama" },
  { key: "hermesai", label: "HermesAI" },
] as const;

export const MODEL_DISCOVERY_PROVIDER_KEYS = [
  "openRouter",
  "openCode",
  "nvidia",
  "groq",
  "openai",
  "google",
  "anthropic",
  "xai",
  "ollama",
  "hermesai",
] as const;

export type ModelDiscoveryProvider =
  (typeof MODEL_DISCOVERY_PROVIDERS)[number]["key"];

export type DiscoveredModel = {
  id: string;
  name?: string;
  ownedBy?: string;
  contextLength?: number;
};

export type ModelDiscoveryResponse = {
  provider: ModelDiscoveryProvider;
  models: DiscoveredModel[];
  warnings?: string[];
};
