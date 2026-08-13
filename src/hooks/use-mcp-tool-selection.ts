"use client";

import { useCallback, useMemo } from "react";
import { appStore } from "@/app/store";
import type { MCPToolInfo } from "app-types/mcp";

export function useMcpToolSelection(tools: MCPToolInfo[], serverId: string) {
  const appStoreMutate = appStore((state) => state.mutate);
  const allowedMcpServers = appStore((state) => state.allowedMcpServers);
  const mcpToolSelections = appStore((state) => state.mcpToolSelections);

  const availableToolNames = useMemo(
    () => tools.map((tool) => tool.name),
    [tools],
  );
  const availableToolNamesSet = useMemo(
    () => new Set(availableToolNames),
    [availableToolNames],
  );

  const selectedToolNames = useMemo(() => {
    const configuredTools =
      mcpToolSelections?.[serverId] ?? allowedMcpServers?.[serverId]?.tools;

    return new Set(
      (configuredTools ?? availableToolNames).filter((toolName) =>
        availableToolNamesSet.has(toolName),
      ),
    );
  }, [
    allowedMcpServers,
    availableToolNames,
    availableToolNamesSet,
    mcpToolSelections,
    serverId,
  ]);

  const updateToolNames = useCallback(
    (update: (currentTools: string[]) => string[]) => {
      appStoreMutate((prev) => {
        const configuredTools =
          prev.mcpToolSelections?.[serverId] ??
          prev.allowedMcpServers?.[serverId]?.tools;
        const currentTools = (configuredTools ?? availableToolNames).filter(
          (toolName) => availableToolNamesSet.has(toolName),
        );
        const nextTools = update(currentTools).filter(
          (toolName, index, list) =>
            availableToolNamesSet.has(toolName) &&
            list.indexOf(toolName) === index,
        );

        const currentAllowedServer = prev.allowedMcpServers?.[serverId];

        return {
          mcpToolSelections: {
            ...(prev.mcpToolSelections ?? {}),
            [serverId]: nextTools,
          },
          ...(currentAllowedServer
            ? {
                allowedMcpServers: {
                  ...prev.allowedMcpServers,
                  [serverId]: {
                    ...currentAllowedServer,
                    tools: nextTools,
                  },
                },
              }
            : {}),
        };
      });
    },
    [appStoreMutate, availableToolNames, availableToolNamesSet, serverId],
  );

  const toggleTool = useCallback(
    (toolName: string) => {
      updateToolNames((currentTools) =>
        currentTools.includes(toolName)
          ? currentTools.filter((name) => name !== toolName)
          : [...currentTools, toolName],
      );
    },
    [updateToolNames],
  );

  const toggleAllTools = useCallback(
    (enabled: boolean) => {
      updateToolNames(() => (enabled ? availableToolNames : []));
    },
    [availableToolNames, updateToolNames],
  );

  const allToolsSelected =
    tools.length > 0 && tools.every((tool) => selectedToolNames.has(tool.name));
  const noToolsSelected =
    tools.length > 0 &&
    tools.every((tool) => !selectedToolNames.has(tool.name));

  return {
    allToolsSelected,
    noToolsSelected,
    selectedToolNames,
    toggleAllTools,
    toggleTool,
  };
}
