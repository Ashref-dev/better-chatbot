"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Gets the actual computed background color from the theme CSS variable.
 * Handles oklch, hsl, rgb, and hex color formats.
 */
export function useThemeColors() {
  const { resolvedTheme, theme } = useTheme();
  const [bg, setBg] = useState<string>("#000000");

  useEffect(() => {
    // Wait for DOM to be ready
    if (typeof window === "undefined") return;

    // Use requestAnimationFrame to ensure styles are computed
    const raf = requestAnimationFrame(() => {
      const style = getComputedStyle(document.body);
      const bgVar = style.getPropertyValue("--background").trim();

      // Try to get the actual computed background color from a temp element
      const temp = document.createElement("div");
      temp.style.backgroundColor = `var(--background)`;
      temp.style.position = "absolute";
      temp.style.visibility = "hidden";
      document.body.appendChild(temp);

      const computedBg = getComputedStyle(temp).backgroundColor;
      document.body.removeChild(temp);

      // computedBg will be in rgb() or rgba() format
      if (computedBg && computedBg !== "rgba(0, 0, 0, 0)") {
        // Convert rgb/rgba to hex
        const rgbMatch = computedBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1]);
          const g = parseInt(rgbMatch[2]);
          const b = parseInt(rgbMatch[3]);
          const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
          setBg(hex);
          return;
        }
        // If it's already a valid color string, use it
        setBg(computedBg);
        return;
      }

      // Fallback: parse the CSS variable directly
      if (bgVar.startsWith("oklch")) {
        // oklch colors - estimate based on lightness
        const match = bgVar.match(/oklch\(([\d.]+)/);
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
      } else if (bgVar.startsWith("#")) {
        setBg(bgVar);
      } else if (bgVar.startsWith("rgb")) {
        const match = bgVar.match(/rgb\(([\d.]+),?\s*([\d.]+),?\s*([\d.]+)/);
        if (match) {
          const r = Math.round(parseFloat(match[1]));
          const g = Math.round(parseFloat(match[2]));
          const b = Math.round(parseFloat(match[3]));
          setBg(
            `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
          );
        }
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [resolvedTheme, theme]);

  return { background: bg };
}
