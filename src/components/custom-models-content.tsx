"use client";

import { useState } from "react";
import { useCustomModels } from "@/hooks/use-custom-models";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useHiddenModels } from "@/hooks/use-hidden-models";
import useSWR from "swr";
import { modelLabelOverridesManager } from "@/lib/ai/model-label-overrides";
import { resolveModelDisplay } from "@/lib/ai/model-labels";
import { useModelLabelOverrides } from "@/hooks/use-model-label-overrides";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Switch } from "ui/switch";
import { Button } from "ui/button";
import { ModelProviderIcon } from "ui/model-provider-icon";
import {
  Trash2,
  Plus,
  Boxes,
  Loader,
  Key,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  X,
  Info,
  Pencil,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "ui/tooltip";
import { toast } from "sonner";

const PROVIDERS = [
  { key: "openRouter", label: "OpenRouter" },
  { key: "nvidia", label: "NVIDIA" },
  { key: "groq", label: "Groq" },
  { key: "openai", label: "OpenAI" },
  { key: "google", label: "Google" },
  { key: "anthropic", label: "Anthropic" },
  { key: "xai", label: "xAI" },
  { key: "ollama", label: "Ollama" },
  { key: "uncloseai", label: "UncloseAI" },
  { key: "hermesai", label: "HermesAI" },
] as const;

// Providers that accept user API keys
const KEY_PROVIDERS = PROVIDERS.filter(
  (p) => !["uncloseai", "hermesai", "ollama"].includes(p.key),
);

type Section = "keys" | "models" | "visibility";

export function CustomModelsContent() {
  const [section, setSection] = useState<Section>("keys");

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50">
        {(
          [
            { id: "keys", label: "API Keys", icon: Key },
            { id: "models", label: "Custom Models", icon: Boxes },
            { id: "visibility", label: "Visibility", icon: Eye },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
              section === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {section === "keys" && <ApiKeysSection />}
      {section === "models" && <CustomModelsSection />}
      {section === "visibility" && <VisibilitySection />}
    </div>
  );
}

function ApiKeysSection() {
  const { apiKeys, isLoading, saveKey, removeKey, getKey } = useApiKeys();
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingKey, setLoadingKey] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hadKeyWhenEditing, setHadKeyWhenEditing] = useState(false);

  const handleEdit = async (provider: string) => {
    setLoadingKey(true);
    setEditingProvider(provider);
    const hasKey = !!apiKeys[provider]?.hasUserKey;
    setHadKeyWhenEditing(hasKey);
    try {
      const key = await getKey(provider);
      setKeyInput(key);
    } catch {
      toast.error("Failed to load API key");
      setKeyInput("");
    }
    setLoadingKey(false);
  };

  const handleSave = async (provider: string) => {
    if (!keyInput.trim()) return;
    setSaving(true);
    try {
      await saveKey(provider, keyInput.trim());
      setEditingProvider(null);
      setKeyInput("");
      toast.success(`API key saved for ${provider}`);
    } catch {
      toast.error("Failed to save API key");
    }
    setSaving(false);
  };

  const handleRemove = async (provider: string) => {
    setDeleting(true);
    try {
      await removeKey(provider);
      setEditingProvider(null);
      setKeyInput("");
      toast.success(`API key removed for ${provider}`);
    } catch {
      toast.error("Failed to remove API key");
    }
    setDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader className="size-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Add your own API keys to use providers with your account. Keys are
          encrypted and synced across devices.
        </p>
      </div>

      <div className="space-y-2">
        {KEY_PROVIDERS.map((p) => {
          const info = apiKeys[p.key];
          const isEditing = editingProvider === p.key;

          return (
            <div
              key={p.key}
              className="relative flex items-center gap-3 p-3 border rounded-lg group"
            >
              {isEditing ? (
                <div className="absolute inset-0 flex items-center gap-2 px-3 bg-background/95 backdrop-blur-sm rounded-lg z-10">
                  <Input
                    type="text"
                    placeholder={
                      loadingKey ? "Loading..." : "Paste your API key..."
                    }
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(p.key);
                      if (e.key === "Escape") {
                        setEditingProvider(null);
                        setKeyInput("");
                      }
                    }}
                    className="h-8 text-xs flex-1 font-mono"
                    autoFocus
                    disabled={loadingKey}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 size-8 hover:bg-emerald-500/10 hover:text-emerald-500"
                    onClick={() => handleSave(p.key)}
                    disabled={saving || loadingKey}
                  >
                    <Check className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 size-8"
                    onClick={() => {
                      setEditingProvider(null);
                      setKeyInput("");
                    }}
                    disabled={loadingKey}
                  >
                    <X className="size-3.5" />
                  </Button>
                  {(hadKeyWhenEditing || deleting) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="shrink-0 size-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleRemove(p.key)}
                      disabled={loadingKey || deleting}
                    >
                      {deleting ? (
                        <Loader className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              ) : null}

              <div className="w-28 shrink-0 flex items-center gap-2">
                <ModelProviderIcon
                  provider={p.key}
                  className="size-4 shrink-0 opacity-60"
                />
                <span className="text-sm font-medium truncate">{p.label}</span>
              </div>

              {!isEditing && (
                <>
                  {info?.hasUserKey ? (
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground font-mono flex-1 truncate min-w-0">
                        {info.preview}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs shrink-0"
                        onClick={() => handleEdit(p.key)}
                        disabled={loadingKey}
                      >
                        <Pencil className="size-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground/50 flex-1 truncate min-w-0">
                        {info?.hasEnvKey
                          ? "Using environment key"
                          : "No key set"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs shrink-0"
                        onClick={() => {
                          setEditingProvider(p.key);
                          setKeyInput("");
                        }}
                      >
                        <Plus className="size-3 mr-1" />
                        Add
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Floating info badge at top-right corner - clickable on mobile, hover on desktop */}
              {info?.hasEnvKey && !isEditing && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="absolute -top-1.5 -right-1.5 size-4 flex items-center justify-center rounded-full bg-background border shrink-0 shadow-sm cursor-help"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Info
                          className={`size-2.5 ${info?.hasUserKey ? "text-amber-500" : "text-emerald-500"}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      className="text-xs max-w-[200px]"
                    >
                      {info?.hasUserKey
                        ? "Custom key overriding environment"
                        : "Environment fallback active"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CustomModelsSection() {
  const { models, isLoading, add, remove, exists } = useCustomModels();
  const [provider, setProvider] = useState<string>(PROVIDERS[0].key);
  const [modelId, setModelId] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customBadge, setCustomBadge] = useState("");
  const [supportsTools, setSupportsTools] = useState(true);
  const overrides = useModelLabelOverrides();

  const handleAdd = async () => {
    const trimmedId = modelId.trim();
    if (!trimmedId) {
      toast.error("Please provide a model ID");
      return;
    }
    if (exists(provider, trimmedId)) {
      toast.error("This model already exists for this provider");
      return;
    }

    if (customLabel.trim() || customBadge.trim()) {
      modelLabelOverridesManager.set(provider, trimmedId, {
        label: customLabel.trim() || undefined,
        badge: customBadge.trim() || undefined,
      });
    }

    await add(provider, trimmedId, supportsTools);
    setModelId("");
    setCustomLabel("");
    setCustomBadge("");
    setSupportsTools(true);
    toast.success("Model added");
  };

  const handleRemove = async (prov: string, mid: string) => {
    modelLabelOverridesManager.remove(prov, mid);
    await remove(prov, mid);
    toast.success("Model removed");
  };

  const providerLabel = (key: string) =>
    PROVIDERS.find((p) => p.key === key)?.label ?? key;

  const grouped = PROVIDERS.map((p) => ({
    ...p,
    models: models.filter((m) => m.provider === p.key),
  })).filter((g) => g.models.length > 0);

  const trimmedId = modelId.trim();

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Add custom model IDs to any provider. Synced across devices.
        </p>
      </div>

      <div className="space-y-3 p-3 sm:p-4 border rounded-lg bg-muted/30">
        {/* Provider grid — uniform 2-col on mobile, 3-col on sm+ */}
        <div className="space-y-2">
          <Label className="text-xs">Provider</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {PROVIDERS.map((p) => (
              <button
                key={p.key}
                onClick={() => setProvider(p.key)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-all ${
                  provider === p.key
                    ? "bg-primary text-primary-foreground ring-1 ring-primary/30"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <span className="truncate">{p.label}</span>
                <ModelProviderIcon
                  provider={p.key}
                  className="size-3.5 shrink-0 ml-1.5 opacity-60"
                />
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/70">
            Selected:{" "}
            <span className="text-foreground font-medium">
              {providerLabel(provider)}
            </span>
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cm-modelId" className="text-xs">
            Model ID
          </Label>
          <Input
            id="cm-modelId"
            placeholder={
              provider === "openRouter"
                ? "e.g., openai/gpt-5-beta"
                : "e.g., my-custom-model"
            }
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            className="h-9"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="cm-label" className="text-xs">
              Label (optional)
            </Label>
            <Input
              id="cm-label"
              placeholder="e.g., GPT 5"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cm-badge" className="text-xs">
              Subtitle (optional)
            </Label>
            <Input
              id="cm-badge"
              placeholder="e.g., beta"
              value={customBadge}
              onChange={(e) => setCustomBadge(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              className="h-9"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="cm-tools" className="text-xs">
              Supports Tool Calls
            </Label>
            <p className="text-[11px] text-muted-foreground">
              Enable if this model can make function/tool calls
            </p>
          </div>
          <Switch
            id="cm-tools"
            checked={supportsTools}
            onCheckedChange={setSupportsTools}
          />
        </div>

        {/* Live preview */}
        {trimmedId && (
          <p className="text-[11px] text-muted-foreground/70 border-t pt-2">
            Will add{" "}
            <span className="text-foreground font-medium">{trimmedId}</span> to{" "}
            <span className="text-foreground font-medium">
              {providerLabel(provider)}
            </span>
          </p>
        )}

        <Button onClick={handleAdd} className="w-full" size="sm">
          <Plus className="size-3.5 mr-2" />
          Add to {providerLabel(provider)}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader className="size-5 animate-spin" />
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Boxes className="size-10 mb-3 opacity-40" />
          <p className="text-sm">No custom models yet.</p>
          <p className="text-xs mt-1">Add a model above to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                <ModelProviderIcon provider={group.key} className="size-3.5" />
                {group.label}
              </div>
              <div className="space-y-1.5">
                {group.models.map((model) => {
                  const display = resolveModelDisplay(
                    model.provider,
                    model.modelId,
                    overrides,
                  );
                  return (
                    <div
                      key={`${model.provider}-${model.modelId}`}
                      className="flex items-center justify-between p-2.5 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">
                            {display.label}
                          </span>
                          {display.badge && (
                            <span className="text-[11px] text-muted-foreground/50 font-normal leading-none shrink-0">
                              {display.badge}
                            </span>
                          )}
                          {!model.supportsTools && (
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted shrink-0">
                              No tools
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground/60 truncate mt-0.5">
                          {model.modelId}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleRemove(model.provider, model.modelId)
                        }
                        className="ml-2 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VisibilitySection() {
  const { data: rawProviders } = useSWR<
    { provider: string; models: { name: string }[] }[]
  >("/api/chat/models", (url: string) => fetch(url).then((r) => r.json()), {
    dedupingInterval: 60_000 * 5,
    revalidateOnFocus: false,
  });
  const { models: customModels } = useCustomModels();
  const {
    hiddenModels,
    isLoading,
    toggleModel,
    resetToDefaults,
    hideAll,
    showAll,
  } = useHiddenModels();
  const overrides = useModelLabelOverrides();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader className="size-5 animate-spin" />
      </div>
    );
  }

  // Merge custom models into provider lists
  const providers = (rawProviders ?? []).map((providerInfo) => {
    const providerCustom = customModels.filter(
      (m) => m.provider === providerInfo.provider,
    );
    return {
      ...providerInfo,
      models: [
        ...providerInfo.models,
        ...providerCustom.map((m) => ({ name: m.modelId, isCustom: true })),
      ],
    };
  });

  // Count totals for buttons
  const allModelKeys = providers.flatMap((p) =>
    p.models.map((m) => `${p.provider}:${m.name}`),
  );
  const visibleCount = allModelKeys.filter(
    (k) => !hiddenModels.includes(k),
  ).length;
  const hiddenCount = hiddenModels.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Toggle which models appear in the selector.
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => showAll()}
            disabled={hiddenCount === 0}
          >
            <Eye className="size-3 mr-1" />
            Show All
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={() => hideAll(allModelKeys)}
            disabled={visibleCount === 0}
          >
            <EyeOff className="size-3 mr-1" />
            Hide All
          </Button>
          {hiddenCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={resetToDefaults}
            >
              <RotateCcw className="size-3 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {providers.map((providerInfo) => (
          <div key={providerInfo.provider}>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              <ModelProviderIcon
                provider={providerInfo.provider}
                className="size-3.5"
              />
              {PROVIDERS.find((p) => p.key === providerInfo.provider)?.label ??
                providerInfo.provider}
            </div>
            <div className="space-y-1">
              {providerInfo.models.map((model) => {
                const key = `${providerInfo.provider}:${model.name}`;
                const hidden = hiddenModels.includes(key);
                const display = resolveModelDisplay(
                  providerInfo.provider,
                  model.name,
                  overrides,
                );
                const isCustom = (model as any).isCustom;

                return (
                  <button
                    key={key}
                    onClick={() => toggleModel(key)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                      hidden
                        ? "opacity-40 hover:opacity-60"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {hidden ? (
                      <EyeOff className="size-3.5 shrink-0 text-muted-foreground" />
                    ) : (
                      <Eye className="size-3.5 shrink-0 text-emerald-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-sm truncate ${hidden ? "line-through" : "font-medium"}`}
                        >
                          {display.label}
                        </span>
                        {display.badge && (
                          <span className="text-[11px] text-muted-foreground/50 font-normal leading-none shrink-0">
                            {display.badge}
                          </span>
                        )}
                        {isCustom && (
                          <span className="text-[9px] text-muted-foreground px-1 py-0.5 rounded bg-muted shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
