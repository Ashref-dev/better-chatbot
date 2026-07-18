import { describe, expect, it, vi } from "vitest";
import {
  canAccessChatModel,
  filterModelProvidersForRole,
  hasFullModelAccess,
} from "./model-access";

const providers = [
  {
    provider: "nvidia",
    models: [
      { name: "thinkingmachines/inkling" },
      { name: "mistralai/mistral-small-4-119b-2603" },
      { name: "qwen/qwen3.5-122b-a10b" },
    ],
  },
  {
    provider: "openai",
    models: [{ name: "gpt-5.6-sol" }],
  },
];

describe("model access", () => {
  it("limits normal users to Inkling and Mistral Small 4", () => {
    expect(filterModelProvidersForRole("user", providers)).toEqual([
      {
        provider: "nvidia",
        models: [
          { name: "thinkingmachines/inkling" },
          { name: "mistralai/mistral-small-4-119b-2603" },
        ],
      },
    ]);
  });

  it("allows editors and admins to use the full catalog", () => {
    expect(hasFullModelAccess("editor")).toBe(true);
    expect(hasFullModelAccess("admin")).toBe(true);
    expect(filterModelProvidersForRole("editor", providers)).toEqual(providers);
  });

  it("rejects unlisted and custom models for normal users", () => {
    expect(
      canAccessChatModel("user", {
        provider: "nvidia",
        model: "thinkingmachines/inkling",
      }),
    ).toBe(true);
    expect(
      canAccessChatModel("user", {
        provider: "openai",
        model: "gpt-5.6-sol",
      }),
    ).toBe(false);
    expect(
      canAccessChatModel(
        "user",
        { provider: "nvidia", model: "thinkingmachines/inkling" },
        "custom-model",
      ),
    ).toBe(false);
  });

  it("treats missing and unknown roles as normal users", () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(hasFullModelAccess(undefined)).toBe(false);
    expect(hasFullModelAccess("unknown-role")).toBe(false);

    warning.mockRestore();
  });
});
