import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseDiscoveredModels } from "./model-discovery";

describe("model discovery parsing", () => {
  it("parses OpenAI-compatible data and removes duplicate IDs", () => {
    expect(
      parseDiscoveredModels({
        data: [
          { id: "z-model", owned_by: "provider" },
          { id: "a-model", name: "A model", context_length: 32768 },
          { id: "a-model", name: "duplicate" },
        ],
      }),
    ).toEqual([
      { id: "a-model", name: "A model", contextLength: 32768 },
      { id: "z-model", ownedBy: "provider" },
    ]);
  });

  it("normalizes native Google model names", () => {
    expect(
      parseDiscoveredModels({
        models: [
          {
            name: "models/gemini-2.5-flash",
            displayName: "Gemini 2.5 Flash",
            inputTokenLimit: 1_000_000,
          },
        ],
      }),
    ).toEqual([
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        contextLength: 1_000_000,
      },
    ]);
  });

  it("adds the OpenCode Go namespace to discovered IDs", () => {
    expect(
      parseDiscoveredModels(
        { data: [{ id: "kimi-k3" }] },
        { idPrefix: "opencode-go/" },
      ),
    ).toEqual([{ id: "opencode-go/kimi-k3" }]);
  });
});
