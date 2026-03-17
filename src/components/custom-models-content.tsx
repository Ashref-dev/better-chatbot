"use client";

import { useState, useEffect, useCallback } from "react";
import { customModelsManager, CustomModel } from "@/lib/ai/custom-models";
import { modelLabelOverridesManager } from "@/lib/ai/model-label-overrides";
import { resolveModelDisplay } from "@/lib/ai/model-labels";
import { useModelLabelOverrides } from "@/hooks/use-model-label-overrides";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Switch } from "ui/switch";
import { Button } from "ui/button";
import { Trash2, Plus, Boxes } from "lucide-react";
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
] as const;

const EVENT_NAME = "custom-models-changed";

export function CustomModelsContent() {
  const [models, setModels] = useState<CustomModel[]>([]);
  const [provider, setProvider] = useState<string>(PROVIDERS[0].key);
  const [modelId, setModelId] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customBadge, setCustomBadge] = useState("");
  const [supportsTools, setSupportsTools] = useState(true);
  const overrides = useModelLabelOverrides();

  const loadModels = useCallback(() => {
    setModels(customModelsManager.getAll());
  }, []);

  useEffect(() => {
    loadModels();
    window.addEventListener(EVENT_NAME, loadModels);
    return () => window.removeEventListener(EVENT_NAME, loadModels);
  }, [loadModels]);

  const handleAdd = () => {
    const trimmedId = modelId.trim();
    if (!trimmedId) {
      toast.error("Please provide a model ID");
      return;
    }
    if (customModelsManager.exists(provider, trimmedId)) {
      toast.error("This model already exists for this provider");
      return;
    }

    customModelsManager.add(provider, trimmedId, supportsTools);

    if (customLabel.trim() || customBadge.trim()) {
      modelLabelOverridesManager.set(provider, trimmedId, {
        label: customLabel.trim() || undefined,
        badge: customBadge.trim() || undefined,
      });
    }

    setModelId("");
    setCustomLabel("");
    setCustomBadge("");
    setSupportsTools(true);
    loadModels();
    toast.success("Model added");
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  const handleRemove = (model: CustomModel) => {
    customModelsManager.remove(model.id);
    modelLabelOverridesManager.remove(model.provider, model.modelId);
    loadModels();
    toast.success("Model removed");
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  const providerLabel = (key: string) =>
    PROVIDERS.find((p) => p.key === key)?.label ?? key;

  // Group models by provider
  const grouped = PROVIDERS.map((p) => ({
    ...p,
    models: models.filter((m) => m.provider === p.key),
  })).filter((g) => g.models.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Custom Models</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add custom model IDs to any provider. These appear alongside the
          built-in models in the model selector.
        </p>
      </div>

      {/* Add form */}
      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
        <div className="space-y-2">
          <Label>Provider</Label>
          <div className="flex flex-wrap gap-1.5">
            {PROVIDERS.map((p) => (
              <button
                key={p.key}
                onClick={() => setProvider(p.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  provider === p.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cm-modelId">Model ID</Label>
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
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="cm-label">Label (optional)</Label>
            <Input
              id="cm-label"
              placeholder="e.g., GPT 5"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-badge">Subtitle (optional)</Label>
            <Input
              id="cm-badge"
              placeholder="e.g., beta"
              value={customBadge}
              onChange={(e) => setCustomBadge(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="cm-tools">Supports Tool Calls</Label>
            <p className="text-xs text-muted-foreground">
              Enable if this model can make function/tool calls
            </p>
          </div>
          <Switch
            id="cm-tools"
            checked={supportsTools}
            onCheckedChange={setSupportsTools}
          />
        </div>

        <Button onClick={handleAdd} className="w-full" size="sm">
          <Plus className="size-3.5 mr-2" />
          Add to {providerLabel(provider)}
        </Button>
      </div>

      {/* Model list grouped by provider */}
      {grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Boxes className="size-10 mb-3 opacity-40" />
          <p className="text-sm">No custom models yet.</p>
          <p className="text-xs mt-1">Add a model above to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.key}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <div className="space-y-1.5">
                {group.models.map((model) => {
                  const display = resolveModelDisplay(
                    model.provider,
                    model.modelId,
                    overrides,
                  );
                  return (
                    <div
                      key={model.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
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
                        onClick={() => handleRemove(model)}
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
