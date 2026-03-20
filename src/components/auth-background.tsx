"use client";

import { Suspense, lazy } from "react";

const Dithering = lazy(() =>
  import("@paper-design/shaders-react").then((mod) => ({
    default: mod.Dithering,
  })),
);

export function AuthBackground() {
  return (
    <Suspense fallback={<div className="absolute inset-0 bg-muted/20" />}>
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen">
        <Dithering
          colorBack="#00000000" // Transparent
          colorFront="#8b5cf6" // Brighter purple - visible but not overpowering
          shape="warp"
          type="4x4"
          speed={0.3}
          className="size-full"
          minPixelRatio={1}
        />
      </div>
    </Suspense>
  );
}
