"use client";

import {
  type DiscoveredModel,
  MODEL_DISCOVERY_PROVIDERS,
  type ModelDiscoveryProvider,
  type ModelDiscoveryResponse,
} from "@/lib/ai/model-discovery-types";
import type { CustomModelEntry } from "app-types/user";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { Input } from "ui/input";
import { ModelProviderIcon } from "ui/model-provider-icon";
import { Switch } from "ui/switch";

type ModelDiscoveryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: ModelDiscoveryProvider;
  onProviderChange?: (provider: ModelDiscoveryProvider) => void;
  existingModels: CustomModelEntry[];
  existingModelsLoading?: boolean;
  onAddModels: (models: CustomModelEntry[]) => Promise<number>;
};

type DiscoveryState = "idle" | "loading" | "ready" | "error";

const PAGE_SIZE = 50;

function normalizeModelId(modelId: string): string {
  return modelId.trim();
}

export function ModelDiscovery({
  open,
  onOpenChange,
  provider,
  onProviderChange,
  existingModels,
  existingModelsLoading = false,
  onAddModels,
}: ModelDiscoveryProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<ModelDiscoveryProvider>(provider);
  const [state, setState] = useState<DiscoveryState>("idle");
  const [result, setResult] = useState<ModelDiscoveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [supportsTools, setSupportsTools] = useState(true);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const discoveryRequestId = useRef(0);
  const hasOpened = useRef(false);

  const providerLabel =
    MODEL_DISCOVERY_PROVIDERS.find((entry) => entry.key === selectedProvider)
      ?.label ?? selectedProvider;

  const providerModels = useMemo(
    () =>
      new Set(
        existingModels
          .filter((model) => model.provider === selectedProvider)
          .map((model) => normalizeModelId(model.modelId)),
      ),
    [existingModels, selectedProvider],
  );

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const models = result?.models ?? [];

    if (!normalizedQuery) return models;

    return models.filter((model) =>
      [model.id, model.name, model.ownedBy]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery)),
    );
  }, [query, result]);

  const totalPages = Math.max(1, Math.ceil(filteredModels.length / PAGE_SIZE));
  const page = Math.min(pageNumber, totalPages);
  const pageStart = (page - 1) * PAGE_SIZE;
  const visibleModels = filteredModels.slice(pageStart, pageStart + PAGE_SIZE);
  const firstVisibleNumber = filteredModels.length === 0 ? 0 : pageStart + 1;
  const lastVisibleNumber = Math.min(
    pageStart + PAGE_SIZE,
    filteredModels.length,
  );

  const reset = useCallback(() => {
    discoveryRequestId.current += 1;
    setState("idle");
    setResult(null);
    setError(null);
    setQuery("");
    setPageNumber(1);
    setAddingIds(new Set());
    setAddedIds(new Set());
  }, []);

  const discover = useCallback(
    async (providerToDiscover: ModelDiscoveryProvider) => {
      const requestId = ++discoveryRequestId.current;
      setState("loading");
      setError(null);
      setResult(null);
      setQuery("");
      setPageNumber(1);
      setAddingIds(new Set());
      setAddedIds(new Set());

      try {
        const response = await fetch("/api/user/model-discovery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: providerToDiscover }),
        });
        const payload = (await response.json()) as
          | ModelDiscoveryResponse
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "The provider could not return its models.",
          );
        }

        if (!("models" in payload)) {
          throw new Error("The provider returned an invalid model list.");
        }

        if (requestId !== discoveryRequestId.current) return;
        setResult(payload);
        setState("ready");
      } catch (discoveryError) {
        if (requestId !== discoveryRequestId.current) return;
        setState("error");
        setError(
          discoveryError instanceof Error
            ? discoveryError.message
            : "Model discovery failed. Please try again.",
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      hasOpened.current = false;
      reset();
      return;
    }

    if (hasOpened.current) return;
    hasOpened.current = true;
    setSelectedProvider(provider);
    void discover(provider);
  }, [discover, open, provider, reset]);

  const selectProvider = (nextProvider: ModelDiscoveryProvider) => {
    if (nextProvider === selectedProvider) return;

    setSelectedProvider(nextProvider);
    onProviderChange?.(nextProvider);
    void discover(nextProvider);
  };

  const addModel = async (model: DiscoveredModel) => {
    const normalizedModelId = normalizeModelId(model.id);
    const isAdded =
      providerModels.has(normalizedModelId) || addedIds.has(normalizedModelId);
    if (isAdded || addingIds.has(normalizedModelId)) return;

    setAddingIds((current) => new Set(current).add(normalizedModelId));
    setError(null);

    try {
      await onAddModels([
        {
          provider: selectedProvider,
          modelId: normalizedModelId,
          supportsTools,
        },
      ]);
      setAddedIds((current) => new Set(current).add(normalizedModelId));
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "The discovered model could not be saved.",
      );
    } finally {
      setAddingIds((current) => {
        const next = new Set(current);
        next.delete(normalizedModelId);
        return next;
      });
    }
  };

  const setSearchQuery = (value: string) => {
    setQuery(value);
    setPageNumber(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pointer-events-auto isolate z-[11001] flex h-[calc(100dvh-1rem)] max-h-[860px] w-[calc(100vw-1rem)] max-w-5xl! flex-col gap-0 overflow-hidden p-0 sm:h-[calc(100dvh-2rem)] sm:w-[calc(100vw-2rem)]">
        <DialogHeader className="shrink-0 border-b px-5 py-5 pr-12 sm:px-6">
          <DialogTitle>Discover {providerLabel} models</DialogTitle>
          <DialogDescription>
            Browse the provider&apos;s live model list and add models to your
            synced catalog without closing this window.
          </DialogDescription>
          <div
            className="-mx-1 mt-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Model discovery providers"
          >
            <div className="flex min-w-max gap-1">
              {MODEL_DISCOVERY_PROVIDERS.map((entry) => {
                const isSelected = entry.key === selectedProvider;

                return (
                  <button
                    key={entry.key}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => selectProvider(entry.key)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <ModelProviderIcon
                      provider={entry.key}
                      className="size-3.5 shrink-0"
                    />
                    {entry.label}
                  </button>
                );
              })}
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          {state === "ready" && result && (
            <div className="shrink-0 space-y-3 border-b px-5 py-4 sm:px-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search discovered models..."
                  aria-label="Search discovered models"
                  className="h-10 pl-9"
                  autoFocus
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {result.models.length} model
                  {result.models.length === 1 ? "" : "s"} found
                  {query
                    ? ` · ${filteredModels.length} match${filteredModels.length === 1 ? "" : "es"}`
                    : ""}
                </span>
                <span>
                  {filteredModels.length === 0
                    ? "No models to show"
                    : `Showing ${firstVisibleNumber}–${lastVisibleNumber} of ${filteredModels.length}`}
                </span>
              </div>
            </div>
          )}

          {state === "loading" && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader className="size-6 animate-spin" />
              <p>Loading {providerLabel} models…</p>
            </div>
          )}

          {state === "error" && (
            <div className="flex min-h-0 flex-1 items-center justify-center p-5 sm:p-8">
              <Alert variant="destructive" className="max-w-xl">
                <AlertTitle>Could not discover models</AlertTitle>
                <AlertDescription className="mt-1 space-y-3">
                  <p>{error}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void discover(selectedProvider)}
                  >
                    <RefreshCw className="mr-1.5 size-3.5" />
                    Try again
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {state === "ready" && result && (
            <div className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 pointer-events-auto sm:px-6">
              {error && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTitle>Could not add model</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result.warnings?.map((warning, index) => (
                <Alert key={`${warning}-${index}`} className="mb-3">
                  <AlertTitle>
                    Some model sources could not be loaded
                  </AlertTitle>
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}

              {visibleModels.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
                  No models match this search.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {visibleModels.map((model) => {
                    const normalizedModelId = normalizeModelId(model.id);
                    const isAdded =
                      providerModels.has(normalizedModelId) ||
                      addedIds.has(normalizedModelId);
                    const isAdding = addingIds.has(normalizedModelId);
                    const isChecking = existingModelsLoading && !isAdded;
                    const secondaryDetails = [
                      model.name && model.name !== model.id ? model.name : null,
                      model.ownedBy,
                      model.contextLength
                        ? `${model.contextLength.toLocaleString()} context`
                        : null,
                    ].filter(Boolean);

                    return (
                      <div
                        key={model.id}
                        className="flex min-w-0 items-center gap-3 rounded-lg border bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-medium"
                            title={model.id}
                          >
                            {model.id}
                          </p>
                          {secondaryDetails.length > 0 && (
                            <p
                              className="mt-0.5 truncate text-xs text-muted-foreground"
                              title={secondaryDetails.join(" · ")}
                            >
                              {secondaryDetails.join(" · ")}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant={isAdded ? "secondary" : "default"}
                          disabled={isAdded || isAdding || isChecking}
                          onClick={() => void addModel(model)}
                          className="shrink-0"
                        >
                          {isAdding ? (
                            <Loader className="size-3.5 animate-spin" />
                          ) : isAdded ? (
                            <Check className="size-3.5" />
                          ) : (
                            <Plus className="size-3.5" />
                          )}
                          {isAdded
                            ? "Already added"
                            : isChecking
                              ? "Checking…"
                              : isAdding
                                ? "Adding…"
                                : "Add"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={supportsTools}
              onCheckedChange={setSupportsTools}
              disabled={state !== "ready"}
            />
            Enable tool calls for added models
          </label>

          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-7"
              aria-label="Previous page"
              title="Previous page"
              disabled={state !== "ready" || page <= 1}
              onClick={() =>
                setPageNumber((current) => Math.max(1, current - 1))
              }
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-16 text-center text-[11px] text-muted-foreground">
              Page {state === "ready" ? page : 1} of{" "}
              {state === "ready" ? totalPages : 1}
            </span>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="size-7"
              aria-label="Next page"
              title="Next page"
              disabled={state !== "ready" || page >= totalPages}
              onClick={() =>
                setPageNumber((current) => Math.min(totalPages, current + 1))
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
