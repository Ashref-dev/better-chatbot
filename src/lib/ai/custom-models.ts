"use client";

import { getStorageManager } from "lib/browser-stroage";

export interface CustomModel {
  id: string;
  provider: string;
  modelId: string;
  supportsTools: boolean;
  createdAt: number;
}

const STORAGE_KEY = "CUSTOM_MODELS_V1";
const LEGACY_KEY = "CUSTOM_OPENROUTER_MODELS";

const storage = getStorageManager<CustomModel[]>(STORAGE_KEY);

function migrateLegacy(): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(LEGACY_KEY);
  if (!raw) return;
  try {
    const legacy: {
      id: string;
      modelId: string;
      supportsTools?: boolean;
      createdAt: number;
    }[] = JSON.parse(raw);
    const existing = storage.get([]);
    if (existing.length > 0) {
      localStorage.removeItem(LEGACY_KEY);
      return;
    }
    const migrated: CustomModel[] = legacy.map((m) => ({
      id: m.id,
      provider: "openRouter",
      modelId: m.modelId,
      supportsTools: m.supportsTools ?? true,
      createdAt: m.createdAt,
    }));
    storage.set(migrated);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    localStorage.removeItem(LEGACY_KEY);
  }
}

let migrated = false;

export const customModelsManager = {
  getAll: (): CustomModel[] => {
    if (!migrated) {
      migrateLegacy();
      migrated = true;
    }
    const models = storage.get([]);
    return models.map((m) => ({
      ...m,
      supportsTools: m.supportsTools ?? true,
    }));
  },

  getByProvider: (provider: string): CustomModel[] => {
    return customModelsManager.getAll().filter((m) => m.provider === provider);
  },

  add: (
    provider: string,
    modelId: string,
    supportsTools: boolean,
  ): CustomModel => {
    const models = storage.get([]);
    const newModel: CustomModel = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      provider,
      modelId,
      supportsTools,
      createdAt: Date.now(),
    };
    storage.set([...models, newModel]);
    return newModel;
  },

  remove: (id: string): void => {
    const models = storage.get([]);
    storage.set(models.filter((m) => m.id !== id));
  },

  exists: (provider: string, modelId: string): boolean => {
    const models = storage.get([]);
    return models.some((m) => m.provider === provider && m.modelId === modelId);
  },
};
