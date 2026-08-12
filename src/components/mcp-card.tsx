"use client";
import {
  FlaskConical,
  ShieldAlertIcon,
  Loader,
  RotateCw,
  Search,
  Settings,
  Settings2,
  Wrench,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "ui/alert";
import { Button } from "ui/button";
import { Card, CardContent, CardHeader } from "ui/card";
import { Checkbox } from "ui/checkbox";
import { Input } from "ui/input";
import JsonView from "ui/json-view";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { memo, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSWRConfig } from "swr";
import { safe } from "ts-safe";

import { handleErrorWithToast } from "ui/shared-toast";
import {
  refreshMcpClientAction,
  removeMcpClientAction,
  shareMcpServerAction,
} from "@/app/api/mcp/actions";
import { ShareableActions, type Visibility } from "./shareable-actions";

import type { MCPServerInfo, MCPToolInfo } from "app-types/mcp";

import { ToolDetailPopup } from "./tool-detail-popup";
import { useTranslations } from "next-intl";
import { Separator } from "ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { appStore } from "@/app/store";
import { cn, isString } from "lib/utils";
import { redriectMcpOauth } from "lib/ai/mcp/oauth-redirect";
import { BasicUser } from "app-types/user";
import { canChangeVisibilityMCP } from "lib/auth/client-permissions";

function useMcpToolSelection(tools: MCPToolInfo[], serverId: string) {
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

// Main MCPCard component
export const MCPCard = memo(function MCPCard({
  id,
  config,
  error,
  status,
  name,
  toolInfo,
  visibility,
  enabled,
  userId,
  user,
  userName,
  userAvatar,
}: MCPServerInfo & { user: BasicUser }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [visibilityChangeLoading, setVisibilityChangeLoading] = useState(false);
  const [toolSearch, setToolSearch] = useState("");
  const [collapsedSection, setCollapsedSection] = useState<
    "configuration" | "tools" | null
  >(null);
  const t = useTranslations("MCP");
  const appStoreMutate = appStore((state) => state.mutate);
  const { mutate } = useSWRConfig();
  const isOwner = userId === user?.id;
  const canChangeVisibility = useMemo(
    () => canChangeVisibilityMCP(user?.role),
    [user?.role],
  );

  const isLoading = useMemo(() => {
    return isProcessing || status === "loading";
  }, [isProcessing, status]);

  const needsAuthorization = status === "authorizing";
  const isDisabled = isLoading || needsAuthorization;
  const hasConfiguration = isOwner && Boolean(config);
  const activeCollapsedSection = hasConfiguration ? collapsedSection : null;
  const isConfigurationExpanded = activeCollapsedSection !== "configuration";
  const isToolsExpanded = activeCollapsedSection !== "tools";
  const configurationFlexBasis = !hasConfiguration
    ? "0%"
    : activeCollapsedSection === "configuration"
      ? "3rem"
      : activeCollapsedSection === "tools"
        ? "calc(100% - 3rem)"
        : "50%";
  const toolsFlexBasis = !hasConfiguration
    ? "100%"
    : activeCollapsedSection === "tools"
      ? "3rem"
      : activeCollapsedSection === "configuration"
        ? "calc(100% - 3rem)"
        : "50%";
  const toolSelection = useMcpToolSelection(toolInfo, id);
  const filteredTools = useMemo(() => {
    const normalizedSearch = toolSearch.trim().toLowerCase();
    if (!normalizedSearch) return toolInfo;

    return toolInfo.filter(
      (tool) =>
        tool.name.toLowerCase().includes(normalizedSearch) ||
        (tool.description ?? "").toLowerCase().includes(normalizedSearch),
    );
  }, [toolInfo, toolSearch]);

  const toggleSection = useCallback(
    (section: "configuration" | "tools") => {
      if (!hasConfiguration) return;
      setCollapsedSection((currentSection) =>
        currentSection === section ? null : section,
      );
    },
    [hasConfiguration],
  );

  // Check permissions (kept for potential future use)

  const errorMessage = useMemo(() => {
    if (error) {
      return isString(error) ? error : JSON.stringify(error);
    }
    return null;
  }, [error]);

  const pipeProcessing = useCallback(
    async (fn: () => Promise<any>) =>
      safe(() => setIsProcessing(true))
        .ifOk(fn)
        .ifOk(() => mutate("/api/mcp/list"))
        .ifFail(handleErrorWithToast)
        .watch(() => setIsProcessing(false)),
    [],
  );

  const handleRefresh = useCallback(
    () => pipeProcessing(() => refreshMcpClientAction(id)),
    [id],
  );

  const handleDelete = useCallback(async () => {
    await pipeProcessing(() => removeMcpClientAction(id));
  }, [id]);

  const handleAuthorize = useCallback(
    () => pipeProcessing(() => redriectMcpOauth(id)),
    [id],
  );

  const handleVisibilityChange = useCallback(
    async (newVisibility: Visibility) => {
      // Map visibility for MCP (public becomes featured)
      const mcpVisibility = newVisibility === "public" ? "public" : "private";
      safe(() => setVisibilityChangeLoading(true))
        .map(async () => shareMcpServerAction(id, mcpVisibility))
        .ifOk(() => {
          mutate("/api/mcp/list");
        })
        .ifFail((e) => {
          handleErrorWithToast(e);
        })
        .watch(() => setVisibilityChangeLoading(false));
    },
    [id],
  );

  return (
    <Card
      key={`mcp-card-${id}-${status}`}
      className="relative hover:border-foreground/20 transition-colors bg-secondary/40"
      data-testid="mcp-server-card"
      data-featured={visibility === "public"}
    >
      {isLoading && (
        <div className="animate-pulse z-10 absolute inset-0 bg-background/50 flex items-center justify-center w-full h-full" />
      )}
      <CardHeader
        key={`header-${status}-${needsAuthorization}`}
        className="flex items-center gap-1 mb-2"
      >
        {isLoading && <Loader className="size-4 z-20 animate-spin mr-1" />}

        <h4 className="font-bold text-xs sm:text-lg flex items-center gap-1">
          {name}
        </h4>

        <div className="flex-1" />

        {needsAuthorization && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAuthorize}
                  disabled={isProcessing}
                >
                  <ShieldAlertIcon className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Authorize</p>
              </TooltipContent>
            </Tooltip>
            <div className="h-4">
              <Separator orientation="vertical" />
            </div>
          </>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              disabled={isDisabled}
              onClick={() =>
                appStoreMutate({
                  mcpCustomizationPopup: {
                    id,
                    name,
                    config,
                    status,
                    toolInfo,
                    error,
                    visibility,
                    enabled,
                    userId,
                  },
                })
              }
            >
              <Settings2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("mcpServerCustomization")}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            {isDisabled ? (
              <div className="cursor-pointer hidden sm:block">
                <Button variant="ghost" size="icon" disabled>
                  <FlaskConical className="size-3.5" />
                </Button>
              </div>
            ) : (
              <Link
                href={`/mcp/test/${encodeURIComponent(id)}`}
                className="cursor-pointer hidden sm:block"
              >
                <Button variant="ghost" size="icon">
                  <FlaskConical className="size-3.5" />
                </Button>
              </Link>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("toolsTest")}</p>
          </TooltipContent>
        </Tooltip>
        <div className="h-4">
          <Separator orientation="vertical" />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RotateCw className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("refresh")}</p>
          </TooltipContent>
        </Tooltip>
        {/* Add sharing actions for owners or visibility indicator for featured servers */}
        <ShareableActions
          type="mcp"
          visibility={visibility === "public" ? "public" : "private"}
          isOwner={isOwner}
          canChangeVisibility={canChangeVisibility}
          editHref={
            isOwner ? `/mcp/modify/${encodeURIComponent(id)}` : undefined
          }
          onVisibilityChange={
            canChangeVisibility ? handleVisibilityChange : undefined
          }
          onDelete={isOwner ? handleDelete : undefined}
          isVisibilityChangeLoading={visibilityChangeLoading}
          isDeleteLoading={isProcessing}
          disabled={isLoading}
          renderActions={() => null}
        />
        {/* Show user info for featured servers */}
        {!isOwner && userName && (
          <>
            <div className="h-4">
              <Separator orientation="vertical" />
            </div>
            <div className="flex items-center gap-1.5 ml-2">
              <Avatar className="size-4 ring shrink-0 rounded-full">
                <AvatarImage src={userAvatar || undefined} />
                <AvatarFallback className="text-xs">
                  {userName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground font-medium">
                {userName}
              </span>
            </div>
          </>
        )}
      </CardHeader>

      {errorMessage && <ErrorAlert error={errorMessage} />}

      {needsAuthorization && (
        <div className="px-6 pb-2">
          <Alert
            className="cursor-pointer hover:bg-accent/10 transition-colors"
            onClick={handleAuthorize}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleAuthorize();
              }
            }}
          >
            <ShieldAlertIcon />
            <AlertTitle>Authorization Required</AlertTitle>
            <AlertDescription>
              Click here to authorize this MCP server and access its tools.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="relative hidden w-full sm:flex">
        <CardContent className="flex min-h-0 min-w-0 w-full flex-row overflow-hidden border-r-0 text-sm max-h-[320px]">
          {/* Only show config to owners to prevent credential exposure */}
          {hasConfiguration && (
            <section
              style={{ flexBasis: configurationFlexBasis }}
              className={cn(
                "flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden border-r border-border/80 transition-[flex-basis] duration-200 ease-out will-change-[flex-basis]",
                isConfigurationExpanded ? "pr-3" : "px-1",
              )}
            >
              <button
                type="button"
                className={cn(
                  "flex min-h-8 w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !isConfigurationExpanded && "justify-center",
                )}
                onClick={() => toggleSection("configuration")}
                aria-controls={`mcp-configuration-${id}`}
                aria-expanded={isConfigurationExpanded}
                aria-label={t("configuration")}
                title={t("configuration")}
              >
                <Settings
                  size={14}
                  className={cn(
                    "shrink-0 transition-colors",
                    isConfigurationExpanded
                      ? "text-muted-foreground"
                      : "text-muted-foreground/50",
                  )}
                />
                <span
                  className={cn(
                    "max-w-[20rem] overflow-hidden truncate whitespace-nowrap text-sm font-medium text-muted-foreground",
                    isConfigurationExpanded
                      ? "opacity-100"
                      : "pointer-events-none max-w-0 opacity-0",
                  )}
                >
                  {t("configuration")}
                </span>
              </button>
              <div
                id={`mcp-configuration-${id}`}
                className={cn(
                  "min-h-0 flex-1 overflow-y-auto pt-2",
                  isConfigurationExpanded
                    ? "opacity-100"
                    : "pointer-events-none opacity-0",
                )}
                aria-hidden={!isConfigurationExpanded}
              >
                <JsonView data={config} />
              </div>
            </section>
          )}

          <section
            style={{ flexBasis: toolsFlexBasis }}
            className={cn(
              "flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden transition-[flex-basis] duration-200 ease-out will-change-[flex-basis]",
              hasConfiguration ? (isToolsExpanded ? "pl-4" : "px-1") : "p-0",
            )}
          >
            <div
              className={cn(
                "z-10 mb-3 flex flex-col gap-2 pt-2 pb-1",
                hasConfiguration ? (isToolsExpanded ? "pr-4" : "p-0") : "pr-2",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                {hasConfiguration ? (
                  <button
                    type="button"
                    className={cn(
                      "flex min-h-8 items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isToolsExpanded
                        ? "min-w-0 flex-1"
                        : "w-full justify-center",
                    )}
                    onClick={() => toggleSection("tools")}
                    aria-controls={`mcp-tools-${id}`}
                    aria-expanded={isToolsExpanded}
                    aria-label={t("availableTools")}
                    title={t("availableTools")}
                  >
                    <Wrench
                      size={14}
                      className={cn(
                        "shrink-0 transition-colors",
                        isToolsExpanded
                          ? "text-muted-foreground"
                          : "text-muted-foreground/50",
                      )}
                    />
                    <span
                      className={cn(
                        "max-w-[20rem] overflow-hidden truncate whitespace-nowrap text-sm font-medium text-muted-foreground",
                        isToolsExpanded
                          ? "opacity-100"
                          : "pointer-events-none max-w-0 opacity-0",
                      )}
                    >
                      {t("availableTools")}
                    </span>
                  </button>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-1.5 py-1">
                    <Wrench
                      size={14}
                      className="shrink-0 text-muted-foreground"
                    />
                    <span className="truncate text-sm font-medium text-muted-foreground">
                      {t("availableTools")}
                    </span>
                  </div>
                )}

                {isToolsExpanded && toolInfo.length > 0 && (
                  <div className="flex shrink-0 items-center gap-1 text-[11px] font-medium">
                    <button
                      type="button"
                      className={cn(
                        "transition-colors",
                        toolSelection.allToolsSelected
                          ? "text-foreground"
                          : "text-muted-foreground/50 hover:text-muted-foreground",
                      )}
                      onClick={() => toolSelection.toggleAllTools(true)}
                      aria-pressed={toolSelection.allToolsSelected}
                    >
                      On
                    </button>
                    <span className="text-muted-foreground/30">/</span>
                    <button
                      type="button"
                      className={cn(
                        "transition-colors",
                        toolSelection.noToolsSelected
                          ? "text-foreground"
                          : "text-muted-foreground/50 hover:text-muted-foreground",
                      )}
                      onClick={() => toolSelection.toggleAllTools(false)}
                      aria-pressed={toolSelection.noToolsSelected}
                    >
                      Off
                    </button>
                  </div>
                )}
              </div>

              {toolInfo.length > 0 && (
                <div
                  className={cn(
                    "relative w-full overflow-hidden",
                    isToolsExpanded
                      ? "max-h-10 opacity-100"
                      : "pointer-events-none max-h-0 opacity-0",
                  )}
                >
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={toolSearch}
                    onChange={(event) => setToolSearch(event.target.value)}
                    placeholder={t("searchTools")}
                    className="h-8 w-full pl-8 text-xs"
                  />
                </div>
              )}
            </div>

            <div
              id={`mcp-tools-${id}`}
              className={cn(
                "min-h-0 flex-1 overflow-y-auto",
                isToolsExpanded
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              aria-hidden={!isToolsExpanded}
            >
              {filteredTools.length > 0 ? (
                <ToolsList
                  tools={filteredTools}
                  serverId={id}
                  selectedToolNames={toolSelection.selectedToolNames}
                  onToggleTool={toolSelection.toggleTool}
                />
              ) : (
                <div className="bg-secondary/30 rounded-md p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    {toolSearch.trim()
                      ? t("noMatchingTools")
                      : t("noToolsAvailable")}
                  </p>
                </div>
              )}
            </div>
          </section>
        </CardContent>
      </div>
    </Card>
  );
});

// Tools list component
const ToolsList = memo(function ToolsList({
  tools,
  serverId,
  selectedToolNames,
  onToggleTool,
}: {
  tools: MCPToolInfo[];
  serverId: string;
  selectedToolNames: Set<string>;
  onToggleTool: (toolName: string) => void;
}) {
  return (
    <div className="space-y-2 pr-2">
      {tools.map((tool) => (
        <div
          key={tool.name}
          className="flex items-start gap-2 rounded-md bg-secondary p-2 transition-colors hover:bg-input"
        >
          <ToolDetailPopup tool={tool} serverId={serverId}>
            <div className="min-w-0 flex-1 cursor-pointer">
              <p className="mb-1 truncate text-sm font-medium">{tool.name}</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                {tool.description}
              </p>
            </div>
          </ToolDetailPopup>

          <Checkbox
            checked={selectedToolNames.has(tool.name)}
            onCheckedChange={() => onToggleTool(tool.name)}
            aria-label={`${tool.name}: ${selectedToolNames.has(tool.name) ? "enabled" : "disabled"}`}
            className="mt-0.5"
          />
        </div>
      ))}
    </div>
  );
});

ToolsList.displayName = "ToolsList";

// Error alert component
const ErrorAlert = memo(({ error }: { error: string }) => (
  <div className="px-6 pb-2">
    <Alert variant="destructive" className="border-destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="whitespace-pre-wrap break-words">
        {error}
      </AlertDescription>
    </Alert>
  </div>
));

ErrorAlert.displayName = "ErrorAlert";
