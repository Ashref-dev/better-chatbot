"use client";

import { getStorageManager } from "lib/browser-stroage";

export type EffectPreferences = Record<string, boolean>;
export type EffectQualityMode = "normal" | "performance" | "disabled";

const STORAGE_KEY = "BACKGROUND_EFFECT_PREFS_V1";
const QUALITY_MODE_KEY = "BACKGROUND_EFFECTS_QUALITY_MODE";
export const EFFECT_PREFS_CHANGED_EVENT = "background-effect-prefs-changed";

const storage = getStorageManager<EffectPreferences>(STORAGE_KEY);
const qualityModeStorage =
  getStorageManager<EffectQualityMode>(QUALITY_MODE_KEY);

const emitChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EFFECT_PREFS_CHANGED_EVENT));
};

const DEFAULT_ENABLED = new Set(["light-rays", "magic-rays", "plasma"]);

const DEBUG_KEY = "BACKGROUND_EFFECT_DEBUG_V1";
const debugStorage = getStorageManager<boolean>(DEBUG_KEY);

export const effectPreferencesManager = {
  getAll: (): EffectPreferences => {
    return storage.get({});
  },

  isEnabled: (name: string): boolean => {
    const prefs = storage.get({});
    if (name in prefs) return prefs[name];
    return DEFAULT_ENABLED.has(name);
  },

  setEnabled: (name: string, enabled: boolean) => {
    storage.set((prev) => ({
      ...(prev || {}),
      [name]: enabled,
    }));
    emitChange();
  },

  reset: () => {
    storage.remove();
    emitChange();
  },

  // Quality mode: normal (high quality), performance (low quality), disabled (off)
  getQualityMode: (): EffectQualityMode => {
    return qualityModeStorage.get("normal");
  },

  setQualityMode: (mode: EffectQualityMode) => {
    qualityModeStorage.set(() => mode);
    emitChange();
  },

  isDebug: (): boolean => {
    return debugStorage.get(false);
  },

  setDebug: (enabled: boolean) => {
    debugStorage.set(() => enabled);
    emitChange();
  },
};
