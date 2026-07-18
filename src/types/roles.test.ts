import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("default user role", () => {
  it("defaults new accounts to the normal user role", async () => {
    vi.stubEnv("DEFAULT_USER_ROLE", "");

    const { DEFAULT_USER_ROLE } = await import("./roles");

    expect(DEFAULT_USER_ROLE).toBe("user");
  });

  it("keeps an explicit valid role override", async () => {
    vi.stubEnv("DEFAULT_USER_ROLE", "editor");

    const { DEFAULT_USER_ROLE } = await import("./roles");

    expect(DEFAULT_USER_ROLE).toBe("editor");
  });
});
