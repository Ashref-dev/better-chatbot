"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function useThemeColors() {
  const { resolvedTheme } = useTheme();
  const [bg, setBg] = useState("#000000");

  useEffect(() => {
    const style = getComputedStyle(document.body);
    const bgVar = style.getPropertyValue("--background").trim();

    if (bgVar.startsWith("oklch")) {
      const match = bgVar.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
      if (match) {
        const l = parseFloat(match[1]);
        setBg(l > 0.5 ? "#ffffff" : "#000000");
      }
    } else if (bgVar.startsWith("hsl")) {
      const match = bgVar.match(/hsl\(([\d.]+)\s+([\d.]+)%?\s+([\d.]+)%?/);
      if (match) {
        const lightness = parseFloat(match[3]);
        setBg(lightness > 50 ? "#ffffff" : "#000000");
      }
    }
  }, [resolvedTheme]);

  return { background: bg };
}
