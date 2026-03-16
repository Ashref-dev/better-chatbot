"use client";

import dynamic from "next/dynamic";

const GradientBlinds = dynamic(() => import("ui/gradient-blinds"), {
  ssr: false,
});

export function AuthBackground() {
  return (
    <GradientBlinds
      gradientColors={["#FF9FFC", "#5227FF"]}
      angle={-25}
      noise={0.3}
      blindCount={12}
      blindMinWidth={50}
      spotlightRadius={0.6}
      spotlightSoftness={1.2}
      spotlightOpacity={0.8}
      mouseDampening={0}
      distortAmount={0}
      shineDirection="left"
      mixBlendMode="lighten"
      autoAnimate
      autoAnimateSpeed={0.25}
    />
  );
}
