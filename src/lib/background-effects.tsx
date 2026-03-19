"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import * as React from "react";
import {
  effectPreferencesManager,
  EFFECT_PREFS_CHANGED_EVENT,
} from "@/lib/background-effect-preferences";

type BackgroundEffect = {
  name: string;
  component: ComponentType;
  overlay?: ComponentType;
};

const LightRaysEffect: BackgroundEffect = {
  name: "light-rays",
  component: dynamic(() => import("ui/light-rays"), { ssr: false }),
  overlay: dynamic(
    () =>
      import("ui/particles").then((mod) => ({
        default: () => <mod.default particleCount={400} particleBaseSize={1} />,
      })),
    { ssr: false },
  ),
};

const PlasmaEffect: BackgroundEffect = {
  name: "plasma",
  component: dynamic(
    () =>
      import("ui/plasma").then((mod) => {
        const PlasmaWrapper = () => {
          const [performance, setPerformance] = React.useState(false);

          React.useEffect(() => {
            const updateMode = () => {
              const mode = effectPreferencesManager.getQualityMode();
              setPerformance(mode === "performance");
            };
            updateMode();

            window.addEventListener(EFFECT_PREFS_CHANGED_EVENT, updateMode);
            return () =>
              window.removeEventListener(
                EFFECT_PREFS_CHANGED_EVENT,
                updateMode,
              );
          }, []);

          return (
            <mod.Plasma
              color="#6b44ff"
              speed={0.3}
              direction="forward"
              scale={1.2}
              opacity={0.5}
              mouseInteractive={false}
              performance={performance}
            />
          );
        };
        return { default: PlasmaWrapper };
      }),
    { ssr: false },
  ),
};

const DottedSurfaceEffect: BackgroundEffect = {
  name: "dotted-surface",
  component: dynamic(
    () =>
      import("ui/dotted-surface").then((mod) => {
        const DottedWrapper = () => {
          const [performanceMode, setPerformanceMode] = React.useState(false);

          React.useEffect(() => {
            const updateMode = () => {
              const mode = effectPreferencesManager.getQualityMode();
              setPerformanceMode(mode === "performance");
            };
            updateMode();

            window.addEventListener(EFFECT_PREFS_CHANGED_EVENT, updateMode);
            return () =>
              window.removeEventListener(
                EFFECT_PREFS_CHANGED_EVENT,
                updateMode,
              );
          }, []);

          return React.createElement(mod.default, {
            performance: performanceMode,
          });
        };
        return { default: DottedWrapper };
      }),
    { ssr: false },
  ),
};

const GalaxyEffect: BackgroundEffect = {
  name: "galaxy",
  component: dynamic(
    () =>
      import("ui/galaxy").then((mod) => {
        const GalaxyWrapper = () => {
          const [performanceMode, setPerformanceMode] = React.useState(false);

          React.useEffect(() => {
            const updateMode = () => {
              const mode = effectPreferencesManager.getQualityMode();
              setPerformanceMode(mode === "performance");
            };
            updateMode();

            window.addEventListener(EFFECT_PREFS_CHANGED_EVENT, updateMode);
            return () =>
              window.removeEventListener(
                EFFECT_PREFS_CHANGED_EVENT,
                updateMode,
              );
          }, []);

          return React.createElement(mod.default, {
            performance: performanceMode,
          });
        };
        return { default: GalaxyWrapper };
      }),
    { ssr: false },
  ),
};

const IsometricWaveEffect: BackgroundEffect = {
  name: "iso-wave",
  component: dynamic(() => import("ui/isometric-wave-grid"), { ssr: false }),
};

const DitheringWaveEffect: BackgroundEffect = {
  name: "dither-wave",
  component: dynamic(() => import("ui/dithering-shader"), { ssr: false }),
};

const MagicRaysEffect: BackgroundEffect = {
  name: "magic-rays",
  component: dynamic(() => import("ui/magic-rays"), { ssr: false }),
};

const DarkVeilEffect: BackgroundEffect = {
  name: "dark-veil",
  component: dynamic(
    () =>
      import("ui/dark-veil").then((mod) => ({
        default: () => (
          <mod.default
            hueShift={0}
            noiseIntensity={0.01}
            scanlineIntensity={0}
            speed={0.8}
            scanlineFrequency={0}
            warpAmount={Math.random() * 5}
          />
        ),
      })),
    { ssr: false },
  ),
};

const PlasmaV2Effect: BackgroundEffect = {
  name: "plasma-v2",
  component: dynamic(
    () =>
      import("ui/plasma-v2").then((mod) => ({
        default: () => (
          <mod.default
            color="#b19eef"
            speed={0.6}
            direction="forward"
            scale={1.0}
            opacity={0.6}
            mouseInteractive={true}
          />
        ),
      })),
    { ssr: false },
  ),
};

const effects: BackgroundEffect[] = [
  LightRaysEffect,
  PlasmaEffect,
  PlasmaV2Effect,
  DottedSurfaceEffect,
  IsometricWaveEffect,
  DitheringWaveEffect,
  MagicRaysEffect,
  GalaxyEffect,
  DarkVeilEffect,
];

export function pickRandomEffect(): BackgroundEffect | null {
  // Check quality mode - disabled = no rendering
  const qualityMode = effectPreferencesManager.getQualityMode();
  if (qualityMode === "disabled") return null;

  const enabled = effects.filter((e) =>
    effectPreferencesManager.isEnabled(e.name),
  );
  if (enabled.length === 0) return null;
  return enabled[Math.floor(Math.random() * enabled.length)];
}

export { effects, type BackgroundEffect };
