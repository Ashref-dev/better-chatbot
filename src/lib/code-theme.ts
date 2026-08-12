import type { BundledTheme } from "shiki/bundle/web";

export const CODE_THEMES = {
  dark: "one-dark-pro",
  light: "one-light",
} as const satisfies Record<"dark" | "light", BundledTheme>;

/**
 * next-themes exposes the resolved system preference separately from the
 * selected theme. Treat anything other than an explicitly resolved light
 * theme as dark until the preference has been resolved, matching the app's
 * dark-first UI and avoiding a light-theme flash on first render.
 */
export function getCodeTheme(resolvedTheme?: string): BundledTheme {
  return resolvedTheme === "light" ? CODE_THEMES.light : CODE_THEMES.dark;
}
