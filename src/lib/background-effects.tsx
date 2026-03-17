"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

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
      import("ui/plasma").then((mod) => ({
        default: () => (
          <mod.Plasma
            color="#6b44ff"
            speed={0.3}
            direction="forward"
            scale={1.2}
            opacity={0.5}
            mouseInteractive={false}
          />
        ),
      })),
    { ssr: false },
  ),
};

const DottedSurfaceEffect: BackgroundEffect = {
  name: "dotted-surface",
  component: dynamic(() => import("ui/dotted-surface"), { ssr: false }),
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

const GalaxyEffect: BackgroundEffect = {
  name: "galaxy",
  component: dynamic(() => import("ui/galaxy"), { ssr: false }),
};

const effects: BackgroundEffect[] = [
  LightRaysEffect,
  PlasmaEffect,
  DottedSurfaceEffect,
  IsometricWaveEffect,
  DitheringWaveEffect,
  MagicRaysEffect,
  GalaxyEffect,
];

import { effectPreferencesManager } from "@/lib/background-effect-preferences";

export function pickRandomEffect(): BackgroundEffect | null {
  // Master disable check - completely skip rendering
  if (effectPreferencesManager.isMasterDisabled()) return null;

  const enabled = effects.filter((e) =>
    effectPreferencesManager.isEnabled(e.name),
  );
  if (enabled.length === 0) return null;
  return enabled[Math.floor(Math.random() * enabled.length)];
}

export { effects, type BackgroundEffect };
