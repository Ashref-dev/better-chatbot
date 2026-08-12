import { describe, expect, test } from "vitest";
import { Github } from "lucide-react";

import { MCPIcon } from "ui/mcp-icon";
import { resolveMcpIcon } from "./mcp-icon-resolver";

describe("resolveMcpIcon", () => {
  test("uses a matching integration icon", () => {
    expect(resolveMcpIcon("GitHub")).toBe(Github);
  });

  test("falls back to the neutral MCP icon for unknown integrations", () => {
    expect(resolveMcpIcon("my-custom-server")).toBe(MCPIcon);
  });

  test("falls back safely when optional matcher input is malformed", () => {
    expect(
      resolveMcpIcon("my-custom-server", null as unknown as string[]),
    ).toBe(MCPIcon);
  });
});
