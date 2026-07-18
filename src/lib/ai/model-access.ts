import type { ChatModel, ModelProviderPresentation } from "app-types/chat";
import { parseRoleString } from "auth/types";

type ModelInfo = {
  name: string;
};

type ModelProviderInfo<TModel extends ModelInfo> = {
  provider: string;
  models: TModel[];
};

export const USER_ALLOWED_CHAT_MODELS = [
  { provider: "nvidia", model: "thinkingmachines/inkling" },
  {
    provider: "nvidia",
    model: "mistralai/mistral-small-4-119b-2603",
  },
] as const satisfies readonly ChatModel[];

export const MODEL_ACCESS_DENIED_MESSAGE =
  "This model is not available for your account";

export const USER_MODEL_PROVIDER_PRESENTATION = {
  label: "Models",
  iconProvider: "hermesai",
  hideModelIds: true,
} as const satisfies ModelProviderPresentation;

const userAllowedModelKeys = new Set(
  USER_ALLOWED_CHAT_MODELS.map(({ provider, model }) =>
    getModelKey(provider, model),
  ),
);

function getModelKey(provider: string, model: string): string {
  return `${provider}:${model}`;
}

export function hasFullModelAccess(role?: string | null): boolean {
  return parseRoleString(role) !== "user";
}

export function getModelProviderPresentation(
  role?: string | null,
): ModelProviderPresentation | undefined {
  return hasFullModelAccess(role)
    ? undefined
    : USER_MODEL_PROVIDER_PRESENTATION;
}

export function canAccessChatModel(
  role: string | null | undefined,
  model?: ChatModel,
  customModelId?: string,
): boolean {
  if (hasFullModelAccess(role)) return true;
  if (!model || customModelId) return false;

  return userAllowedModelKeys.has(getModelKey(model.provider, model.model));
}

export function filterModelProvidersForRole<
  TModel extends ModelInfo,
  TProvider extends ModelProviderInfo<TModel>,
>(
  role: string | null | undefined,
  providers: readonly TProvider[],
): Array<Omit<TProvider, "models"> & { models: TModel[] }> {
  if (hasFullModelAccess(role)) {
    return providers.map((provider) => ({
      ...provider,
      models: [...provider.models],
    }));
  }

  return providers.flatMap((provider) => {
    const models = provider.models.filter((model) =>
      userAllowedModelKeys.has(getModelKey(provider.provider, model.name)),
    );

    return models.length > 0 ? [{ ...provider, models }] : [];
  });
}

export function getModelProvidersForRole<
  TModel extends ModelInfo,
  TProvider extends ModelProviderInfo<TModel>,
>(
  role: string | null | undefined,
  providers: readonly TProvider[],
): Array<
  Omit<TProvider, "models"> & {
    models: TModel[];
    presentation?: ModelProviderPresentation;
  }
> {
  const filteredProviders = filterModelProvidersForRole<TModel, TProvider>(
    role,
    providers,
  );
  const presentation = getModelProviderPresentation(role);

  if (!presentation) return filteredProviders;

  return filteredProviders.map((provider) => ({
    ...provider,
    presentation,
  }));
}
