"use client";

import { getStorageManager } from "lib/browser-stroage";

export interface CustomOpenRouterModel {
  id: string;
  displayName: string;
  modelId: string; // e.g., "openai/gpt-5-nano"
  supportsTools: boolean;
  createdAt: number;
}

const STORAGE_KEY = "CUSTOM_OPENROUTER_MODELS";

const storage = getStorageManager<CustomOpenRouterModel[]>(STORAGE_KEY);

export const customOpenRouterModelsManager = {
  getAll: (): CustomOpenRouterModel[] => {
    const models = storage.get([]);
    // Ensure backward compatibility: if supportsTools is undefined, default to true
    return models.map((model) => ({
      ...model,
      supportsTools: model.supportsTools ?? true,
    }));
  },

  add: (
    displayName: string,
    modelId: string,
    supportsTools: boolean,
  ): CustomOpenRouterModel => {
    const models = storage.get([]);
    const newModel: CustomOpenRouterModel = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      displayName,
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

  update: (
    id: string,
    updates: Partial<
      Pick<CustomOpenRouterModel, "displayName" | "modelId" | "supportsTools">
    >,
  ): void => {
    const models = storage.get([]);
    storage.set(models.map((m) => (m.id === id ? { ...m, ...updates } : m)));
  },

  exists: (modelId: string): boolean => {
    const models = storage.get([]);
    return models.some((m) => m.modelId === modelId);
  },
};
