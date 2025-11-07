"use client";

import { useState, useEffect } from "react";
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
import {
  customOpenRouterModelsManager,
  CustomOpenRouterModel,
} from "@/lib/ai/custom-openrouter-models";
import { Trash2, Plus, Loader } from "lucide-react";
import { toast } from "sonner";

interface ManageOpenRouterModelsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageOpenRouterModelsDialog({
  open,
  onOpenChange,
}: ManageOpenRouterModelsDialogProps) {
  const [models, setModels] = useState<CustomOpenRouterModel[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [modelId, setModelId] = useState("");
  const [supportsTools, setSupportsTools] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (open) {
      loadModels();
    }
  }, [open]);

  const loadModels = () => {
    setModels(customOpenRouterModelsManager.getAll());
  };

  const handleAdd = () => {
    if (!displayName.trim() || !modelId.trim()) {
      toast.error("Please provide both display name and model ID");
      return;
    }

    if (customOpenRouterModelsManager.exists(modelId)) {
      toast.error("This model ID already exists");
      return;
    }

    setIsAdding(true);
    try {
      customOpenRouterModelsManager.add(
        displayName.trim(),
        modelId.trim(),
        supportsTools,
      );
      setDisplayName("");
      setModelId("");
      setSupportsTools(true);
      loadModels();
      toast.success("Model added successfully");
      // Trigger a re-render of model selector by dispatching custom event
      window.dispatchEvent(new Event("openrouter-models-changed"));
    } catch (_error) {
      toast.error("Failed to add model");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = (id: string) => {
    customOpenRouterModelsManager.remove(id);
    loadModels();
    toast.success("Model removed successfully");
    // Trigger a re-render of model selector
    window.dispatchEvent(new Event("openrouter-models-changed"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage OpenRouter Models</DialogTitle>
          <DialogDescription>
            Add custom OpenRouter model IDs to access the latest models. Use the
            format: <code className="text-xs">provider/model-name</code> (e.g.,
            openai/gpt-5-beta)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Add new model form */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g., GPT-5 Beta"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAdding) {
                    handleAdd();
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modelId">Model ID</Label>
              <Input
                id="modelId"
                placeholder="e.g., openai/gpt-5-beta"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isAdding) {
                    handleAdd();
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="supportsTools">Supports Tool Calls</Label>
                <p className="text-xs text-muted-foreground">
                  Enable if this model can make function/tool calls
                </p>
              </div>
              <Switch
                id="supportsTools"
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
                <>
                  <Loader className="size-3.5 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="size-3.5 mr-2" />
                  Add Model
                </>
              )}
            </Button>
          </div>

          {/* List of custom models */}
          <div className="flex-1 overflow-y-auto space-y-2">
            <Label>Your Custom Models ({models.length})</Label>
            {models.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No custom models yet. Add one above to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">
                          {model.displayName}
                        </p>
                        {!model.supportsTools && (
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                            No tools
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {model.modelId}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(model.id)}
                      className="ml-2 shrink-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
