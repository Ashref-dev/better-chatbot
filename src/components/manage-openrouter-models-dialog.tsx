"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Label } from "ui/label";
import { Switch } from "ui/switch";
import { useCustomModels } from "@/hooks/use-custom-models";
import { modelLabelOverridesManager } from "@/lib/ai/model-label-overrides";
import { useModelLabelOverrides } from "@/hooks/use-model-label-overrides";
import { resolveModelDisplay } from "@/lib/ai/model-labels";
import {
  Trash2,
  Plus,
  Loader,
  ArrowRight,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { appStore } from "@/app/store";

interface ManageOpenRouterModelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageOpenRouterModelsDialog({
  open,
  onOpenChange,
}: ManageOpenRouterModelsDialogProps) {
  const { models, add, remove, exists, mutate } = useCustomModels();
  const overrides = useModelLabelOverrides();
  const [modelId, setModelId] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [customBadge, setCustomBadge] = useState("");
  const [supportsTools, setSupportsTools] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editSupportsTools, setEditSupportsTools] = useState(true);

  const handleAdd = async () => {
    if (!modelId.trim()) {
      toast.error("Please provide a model ID");
      return;
    }

    if (exists("openRouter", modelId)) {
      toast.error("This model ID already exists");
      return;
    }

    setIsAdding(true);
    try {
      await add("openRouter", modelId.trim(), supportsTools);

      if (customLabel.trim() || customBadge.trim()) {
        modelLabelOverridesManager.set("openRouter", modelId.trim(), {
          label: customLabel.trim() || undefined,
          badge: customBadge.trim() || undefined,
        });
      }

      setModelId("");
      setCustomLabel("");
      setCustomBadge("");
      setSupportsTools(true);
      toast.success("Model added successfully");
    } catch (_error) {
      toast.error("Failed to add model");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (provider: string, modelIdToRemove: string) => {
    modelLabelOverridesManager.remove(provider, modelIdToRemove);
    await remove(provider, modelIdToRemove);
    toast.success("Model removed");
  };

  const startEdit = (modelIdToEdit: string) => {
    const model = models.find(
      (entry) =>
        entry.provider === "openRouter" && entry.modelId === modelIdToEdit,
    );
    if (!model) return;

    const currentOverride =
      overrides[`openrouter::${modelIdToEdit.toLowerCase()}`];
    setEditingModel(modelIdToEdit);
    setEditLabel(currentOverride?.label || "");
    setEditBadge(currentOverride?.badge || "");
    setEditSupportsTools(model.supportsTools);
  };

  const cancelEdit = () => {
    setEditingModel(null);
    setEditLabel("");
    setEditBadge("");
    setEditSupportsTools(true);
  };

  const saveEdit = async () => {
    if (!editingModel) return;

    if (editLabel.trim() || editBadge.trim()) {
      modelLabelOverridesManager.set("openRouter", editingModel, {
        label: editLabel.trim() || undefined,
        badge: editBadge.trim() || undefined,
      });
    } else {
      modelLabelOverridesManager.remove("openRouter", editingModel);
    }

    const updatedModels = models.map((model) =>
      model.provider === "openRouter" && model.modelId === editingModel
        ? { ...model, supportsTools: editSupportsTools }
        : model,
    );
    const currentModel = models.find(
      (model) =>
        model.provider === "openRouter" && model.modelId === editingModel,
    );

    if (currentModel?.supportsTools !== editSupportsTools) {
      await mutate(
        async () => {
          const response = await fetch("/api/user/custom-models", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedModels),
          });
          if (!response.ok) throw new Error("Failed to update custom model");
          return updatedModels;
        },
        { optimisticData: updatedModels, rollbackOnError: true },
      );
    }

    cancelEdit();
    toast.success("Model updated");
  };

  const openFullSettings = () => {
    onOpenChange(false);
    // Tab index 3 = Custom Models
    appStore.setState({
      openChatPreferences: true,
      chatPreferencesTab: 3,
    });
  };

  // Group by provider for display — only OpenRouter models for this dialog
  const grouped = useMemo(() => {
    const orModels = models.filter((m) => m.provider === "openRouter");
    return orModels.length > 0
      ? [{ key: "openRouter", label: "OpenRouter", models: orModels }]
      : [];
  }, [models]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Quick Add — OpenRouter</DialogTitle>
          <DialogDescription>
            Quickly add an OpenRouter model. Use{" "}
            <code className="text-xs">provider/model-name</code> format.
          </DialogDescription>
        </DialogHeader>

        {/* Compact add form */}
        <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
          <div className="space-y-1.5">
            <Label htmlFor="or-modelId" className="text-xs">
              Model ID
            </Label>
            <Input
              id="or-modelId"
              placeholder="e.g., openai/gpt-5-beta"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isAdding) handleAdd();
              }}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="or-label" className="text-xs">
                Label
              </Label>
              <Input
                id="or-label"
                placeholder="optional"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAdding) handleAdd();
                }}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="or-badge" className="text-xs">
                Subtitle
              </Label>
              <Input
                id="or-badge"
                placeholder="optional"
                value={customBadge}
                onChange={(e) => setCustomBadge(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAdding) handleAdd();
                }}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="or-tools" className="text-xs">
              Tool calls
            </Label>
            <Switch
              id="or-tools"
              checked={supportsTools}
              onCheckedChange={setSupportsTools}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={isAdding}
            className="w-full"
            size="sm"
          >
            {isAdding ? (
              <Loader className="size-3.5 mr-2 animate-spin" />
            ) : (
              <Plus className="size-3.5 mr-2" />
            )}
            Add Model
          </Button>
        </div>

        {/* Scrollable model list — OpenRouter models only */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs text-muted-foreground">
              OpenRouter Models ({grouped[0]?.models.length ?? 0})
            </Label>
          </div>

          {grouped.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">
              No custom OpenRouter models yet.
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {grouped.map((group) => (
                <div key={group.key}>
                  <div className="space-y-1">
                    {group.models.map((model) => {
                      const display = resolveModelDisplay(
                        model.provider,
                        model.modelId,
                        overrides,
                      );
                      const isEditing = editingModel === model.modelId;

                      if (isEditing) {
                        return (
                          <div
                            key={`${model.provider}:${model.modelId}`}
                            className="p-2 border rounded-md bg-muted/30 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-muted-foreground truncate">
                                {model.modelId}
                              </span>
                              <div className="flex gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={saveEdit}
                                  aria-label="Save model"
                                  title="Save model"
                                  className="size-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                                >
                                  <Check className="size-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={cancelEdit}
                                  aria-label="Cancel editing"
                                  title="Cancel editing"
                                  className="size-7"
                                >
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                aria-label="Model label"
                                placeholder="Label"
                                value={editLabel}
                                onChange={(event) =>
                                  setEditLabel(event.target.value)
                                }
                                className="h-8 text-xs"
                              />
                              <Input
                                aria-label="Model subtitle"
                                placeholder="Subtitle"
                                value={editBadge}
                                onChange={(event) =>
                                  setEditBadge(event.target.value)
                                }
                                className="h-8 text-xs"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px]">Tool calls</Label>
                              <Switch
                                checked={editSupportsTools}
                                onCheckedChange={setEditSupportsTools}
                              />
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${model.provider}:${model.modelId}`}
                          className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors group/item"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-xs truncate">
                                {display.label}
                              </span>
                              {display.badge && (
                                <span className="text-[10px] text-muted-foreground/50 leading-none shrink-0">
                                  {display.badge}
                                </span>
                              )}
                              {!model.supportsTools && (
                                <span className="text-[9px] text-muted-foreground px-1 py-0.5 rounded bg-muted shrink-0">
                                  No tools
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground/50 truncate">
                              {model.modelId}
                            </p>
                          </div>
                          <div className="flex gap-1 ml-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(model.modelId)}
                              aria-label={`Edit ${display.label}`}
                              title="Edit model"
                              className="size-7 sm:opacity-0 sm:group-hover/item:opacity-100 hover:bg-muted transition-all"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleRemove(model.provider, model.modelId)
                              }
                              aria-label={`Delete ${display.label}`}
                              title="Delete model"
                              className="size-7 sm:opacity-0 sm:group-hover/item:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Full settings link */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={openFullSettings}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Model Settings
            <ArrowRight className="size-3 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
