"use client";

import { useChatModels } from "@/hooks/queries/use-chat-models";
import { useModelLabelOverrides } from "@/hooks/use-model-label-overrides";
import {
  getModelLabelOverrideKey,
  modelLabelOverridesManager,
} from "lib/ai/model-label-overrides";
import { resolveModelDisplay } from "lib/ai/model-labels";
import { RotateCcw, Search } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { ModelProviderIcon } from "ui/model-provider-icon";

type ModelRow = {
  provider: string;
  model: string;
  key: string;
};

export function ModelLabelsContent() {
  const { data: providers, isLoading } = useChatModels();
  const overrides = useModelLabelOverrides();
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<
    Record<string, { label: string; badge: string }>
  >({});
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const autoSave = useCallback(
    (
      provider: string,
      model: string,
      draft: { label: string; badge: string },
    ) => {
      const key = getModelLabelOverrideKey(provider, model);
      if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
      saveTimers.current[key] = setTimeout(() => {
        modelLabelOverridesManager.set(provider, model, {
          label: draft.label,
          badge: draft.badge,
        });
      }, 500);
    },
    [],
  );

  const rows = useMemo<ModelRow[]>(() => {
    return (
      providers?.flatMap((provider) =>
        provider.models.map((model) => ({
          provider: provider.provider,
          model: model.name,
          key: getModelLabelOverrideKey(provider.provider, model.name),
        })),
      ) || []
    );
  }, [providers]);

  const getDraft = (provider: string, model: string) => {
    const key = getModelLabelOverrideKey(provider, model);
    const fromState = drafts[key];
    if (fromState) return fromState;

    const resolved = resolveModelDisplay(provider, model, overrides);
    return {
      label: resolved.source === "fallback" ? "" : resolved.label,
      badge: resolved.badge || "",
    };
  };

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;

    return rows.filter(({ provider, model }) => {
      const draft = getDraft(provider, model);
      return [provider, model, draft.label, draft.badge]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [rows, search, drafts, overrides]);

  const onDraftChange = (
    provider: string,
    model: string,
    patch: Partial<{ label: string; badge: string }>,
  ) => {
    const key = getModelLabelOverrideKey(provider, model);
    const current = getDraft(provider, model);
    const updated = { ...current, ...patch };
    setDrafts((prev) => ({
      ...prev,
      [key]: updated,
    }));
    autoSave(provider, model, updated);
  };

  const resetRow = (provider: string, model: string) => {
    const key = getModelLabelOverrideKey(provider, model);
    modelLabelOverridesManager.remove(provider, model);
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    toast.success("Model label reset");
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-xl font-semibold">Model Labels</h3>
      <p className="text-sm text-muted-foreground py-2 pb-6">
        Set cleaner model names and optional variant badges. If not set, the app
        falls back to its default model name. These preferences are saved only
        in your browser (local storage), not in the database.
      </p>

      <div className="flex flex-col gap-4 w-full">
        <div className="relative w-full">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search provider, model, label, or badge"
          />
        </div>

        <div className="max-h-[64vh] overflow-y-auto rounded-lg border divide-y">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              Loading models…
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No models found for this filter.
            </div>
          ) : (
            filteredRows.map(({ key, provider, model }) => {
              const draft = getDraft(provider, model);
              const preview = resolveModelDisplay(provider, model, {
                ...overrides,
                [key]: {
                  label: draft.label.trim() || undefined,
                  badge: draft.badge.trim() || undefined,
                  updatedAt: Date.now(),
                },
              });

              return (
                <div key={key} className="p-4 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2 items-center">
                    <ModelProviderIcon provider={provider} className="size-4" />
                    <span className="text-sm font-medium">{provider}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[60ch]">
                      {model}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Preview:</span>
                    <span className="font-medium">{preview.label}</span>
                    {preview.badge && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 py-0 text-[10px]"
                      >
                        {preview.badge}
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-2 items-center">
                    <Input
                      value={draft.label}
                      onChange={(e) =>
                        onDraftChange(provider, model, {
                          label: e.target.value,
                        })
                      }
                      placeholder="Clean name (e.g., GPT 5)"
                    />
                    <Input
                      value={draft.badge}
                      onChange={(e) =>
                        onDraftChange(provider, model, {
                          badge: e.target.value,
                        })
                      }
                      placeholder="Badge (e.g., mini)"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetRow(provider, model)}
                      >
                        <RotateCcw className="size-3.5 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
