"use client";

import { effects } from "@/lib/background-effects";
import { effectPreferencesManager } from "@/lib/background-effect-preferences";
import { useEffectPreferences } from "@/hooks/use-effect-preferences";
import { Switch } from "ui/switch";
import { RotateCcw } from "lucide-react";
import { Button } from "ui/button";
import { toast } from "sonner";

const EFFECT_DESCRIPTIONS: Record<string, string> = {
  "light-rays": "WebGL god rays with floating particles",
  plasma: "Colorful plasma swirl shader",
  "dotted-surface": "3D animated dot wave grid",
  "iso-wave": "Topographic wave lines with mouse interaction",
  "dither-wave": "Retro dithered sine wave shader",
  "magic-rays": "Soft animated light beams (CSS)",
  galaxy: "Starfield with twinkling and rotation",
};

export function BackgroundEffectsContent() {
  // Subscribe to preference changes for reactivity
  useEffectPreferences();

  const enabledCount = effects.filter((e) =>
    effectPreferencesManager.isEnabled(e.name),
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Background Effects</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Choose which ambient effects can appear. A random one is picked each
          time you visit. Disable all to turn off background effects entirely.
        </p>
      </div>

      <div className="text-xs text-muted-foreground">
        {enabledCount} of {effects.length} effects enabled
      </div>

      <div className="space-y-3">
        {effects.map((effect) => {
          const enabled = effectPreferencesManager.isEnabled(effect.name);
          return (
            <div
              key={effect.name}
              className="flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <div className="space-y-0.5">
                <div className="text-sm font-medium">{effect.name}</div>
                {EFFECT_DESCRIPTIONS[effect.name] && (
                  <div className="text-xs text-muted-foreground">
                    {EFFECT_DESCRIPTIONS[effect.name]}
                  </div>
                )}
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) =>
                  effectPreferencesManager.setEnabled(effect.name, checked)
                }
              />
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          effectPreferencesManager.reset();
          toast.success(
            "Reset to defaults — Light Rays, Magic Rays & Plasma enabled",
          );
        }}
      >
        <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
        Reset to defaults
      </Button>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Debug mode</div>
            <div className="text-xs text-muted-foreground">
              Show effect switcher buttons on screen
            </div>
          </div>
          <Switch
            checked={effectPreferencesManager.isDebug()}
            onCheckedChange={(checked) =>
              effectPreferencesManager.setDebug(checked)
            }
          />
        </div>
      </div>
    </div>
  );
}
