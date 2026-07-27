import { describe, expect, it, vi } from "vitest";
import {
  canAccessChatModel,
  filterModelProvidersForRole,
  getModelProvidersForRole,
  hasFullModelAccess,
} from "./model-access";

const providers = [
  {
    provider: "nvidia",
    models: [
      { name: "thinkingmachines/inkling" },
      { name: "mistralai/mistral-nemotron" },
      { name: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning" },
      { name: "nvidia/nemotron-3-super-120b-a12b" },
      { name: "nvidia/nemotron-3-ultra-550b-a55b" },
      { name: "nvidia/nemotron-nano-12b-v2-vl" },
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
          { name: "mistralai/mistral-nemotron" },
          { name: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning" },
          { name: "nvidia/nemotron-3-super-120b-a12b" },
          { name: "nvidia/nemotron-3-ultra-550b-a55b" },
          { name: "nvidia/nemotron-nano-12b-v2-vl" },
        ],
      },
    ]);
  });

  it("allows editors and admins to use the full catalog", () => {
    expect(hasFullModelAccess("editor")).toBe(true);
    expect(hasFullModelAccess("admin")).toBe(true);
    expect(filterModelProvidersForRole("editor", providers)).toEqual(providers);
  });

  it("presents normal-user models as one anonymous group", () => {
    expect(getModelProvidersForRole("user", providers)).toEqual([
      {
        provider: "nvidia",
        models: [
          { name: "thinkingmachines/inkling" },
          { name: "mistralai/mistral-nemotron" },
          { name: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning" },
          { name: "nvidia/nemotron-3-super-120b-a12b" },
          { name: "nvidia/nemotron-3-ultra-550b-a55b" },
          { name: "nvidia/nemotron-nano-12b-v2-vl" },
        ],
        presentation: {
          label: "Models",
          iconProvider: "hermesai",
          hideModelIds: true,
        },
      },
    ]);
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
