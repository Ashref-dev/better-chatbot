"use client";

import { useEffect, useState } from "react";
import {
  effectPreferencesManager,
  EFFECT_PREFS_CHANGED_EVENT,
  type EffectPreferences,
} from "@/lib/background-effect-preferences";

export function useEffectPreferences(): EffectPreferences {
  const [prefs, setPrefs] = useState<EffectPreferences>(() =>
    effectPreferencesManager.getAll(),
  );

  useEffect(() => {
    const handler = () => setPrefs(effectPreferencesManager.getAll());
    window.addEventListener(EFFECT_PREFS_CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EFFECT_PREFS_CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return prefs;
}
