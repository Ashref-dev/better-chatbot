"use client";

import { getStorageManager } from "lib/browser-stroage";

export type ModelLabelOverride = {
  label?: string;
  badge?: string;
  updatedAt: number;
};

export type ModelLabelOverridesMap = Record<string, ModelLabelOverride>;

const STORAGE_KEY = "MODEL_LABEL_OVERRIDES_V1";
export const MODEL_LABEL_OVERRIDES_CHANGED_EVENT =
  "model-label-overrides-changed";

const storage = getStorageManager<ModelLabelOverridesMap>(STORAGE_KEY);
let syncTimer: ReturnType<typeof setTimeout> | null = null;

const emitChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MODEL_LABEL_OVERRIDES_CHANGED_EVENT));
};

const scheduleServerSync = (overrides: ModelLabelOverridesMap) => {
  if (typeof window === "undefined") return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fetch("/api/user/model-label-overrides", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(overrides),
    }).catch(() => {
      // Keep local overrides even if sync fails.
    });
  }, 350);
};

export const getModelLabelOverrideKey = (provider: string, model: string) => {
  return `${provider.toLowerCase()}::${model.toLowerCase()}`;
};

export const modelLabelOverridesManager = {
  getAll: (): ModelLabelOverridesMap => {
    return storage.get({});
  },

  get: (provider: string, model: string): ModelLabelOverride | undefined => {
    const key = getModelLabelOverrideKey(provider, model);
    return storage.get({})[key];
  },

  set: (
    provider: string,
    model: string,
    override: { label?: string; badge?: string },
  ) => {
    const key = getModelLabelOverrideKey(provider, model);
    const nextLabel = override.label?.trim() || undefined;
    const nextBadge = override.badge?.trim() || undefined;

    storage.set((prev) => {
      const next = { ...(prev || {}) };

      if (!nextLabel && !nextBadge) {
        delete next[key];
        scheduleServerSync(next);
        return next;
      }

      next[key] = {
        label: nextLabel,
        badge: nextBadge,
        updatedAt: Date.now(),
      };
      scheduleServerSync(next);
      return next;
    });

    emitChange();
  },

  remove: (provider: string, model: string) => {
    const key = getModelLabelOverrideKey(provider, model);
    storage.set((prev) => {
      const next = { ...(prev || {}) };
      delete next[key];
      scheduleServerSync(next);
      return next;
    });
    emitChange();
  },

  clear: () => {
    storage.remove();
    scheduleServerSync({});
    emitChange();
  },

  replaceAll: (
    overrides: ModelLabelOverridesMap,
    options?: { emit?: boolean; sync?: boolean },
  ) => {
    const next = { ...(overrides || {}) };
    storage.set(next);
    if (options?.sync) {
      scheduleServerSync(next);
    }
    if (options?.emit !== false) {
      emitChange();
    }
  },
};
