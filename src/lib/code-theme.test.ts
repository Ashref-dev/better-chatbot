import { describe, expect, test } from "vitest";
import { CODE_THEMES, getCodeTheme } from "./code-theme";

describe("code themes", () => {
  test("uses the paired editor themes for each resolved color mode", () => {
    expect(getCodeTheme("dark")).toBe(CODE_THEMES.dark);
    expect(getCodeTheme("light")).toBe(CODE_THEMES.light);
  });

  test("keeps the dark-first default until the theme is resolved", () => {
    expect(getCodeTheme()).toBe(CODE_THEMES.dark);
    expect(getCodeTheme("system")).toBe(CODE_THEMES.dark);
  });
});
