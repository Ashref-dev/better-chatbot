const MODEL_PROVIDER_LABELS: Record<string, string> = {
  openCode: "OpenCode",
};

export function getModelProviderLabel(provider?: string): string {
  if (!provider) return "";
  return MODEL_PROVIDER_LABELS[provider] ?? provider;
}
