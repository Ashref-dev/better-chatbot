"use client";

import { appStore } from "@/app/store";
import { AllowedMCPServer } from "app-types/mcp";
import { cn } from "lib/utils";
import {
  ArrowUpRightIcon,
  AtSign,
  ChartColumn,
  ChevronRight,
  CodeIcon,
  GlobeIcon,
  HardDriveUploadIcon,
  ImagesIcon,
  InfoIcon,
  Loader,
  MessageCircle,
  MousePointer2,
  Package,
  Plus,
  ShieldAlertIcon,
  Waypoints,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Input } from "ui/input";

import { useTranslations } from "next-intl";

import { Switch } from "ui/switch";
import { useShallow } from "zustand/shallow";
import { useMcpList } from "@/hooks/queries/use-mcp-list";
import { useWorkflowToolList } from "@/hooks/queries/use-workflow-tool-list";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";
import { WorkflowSummary } from "app-types/workflow";
import { WorkflowGreeting } from "./workflow/workflow-greeting";
import { AppDefaultToolkit } from "lib/ai/tools";
import { APP_DEFAULT_TOOL_KIT } from "lib/ai/tools/tool-kit";
import { ChatMention } from "app-types/chat";
import {
  MobileAwareSubmenu,
  MobileSubmenuProvider,
  MobileCompatibleMenuItem,
} from "ui/mobile-aware-submenu";

import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";
import { AgentSummary } from "app-types/agent";
import { authClient } from "auth/client";
import { resolveMcpIcon } from "lib/mcp-icon-resolver";

import { safe } from "ts-safe";
import { mutate } from "swr";
import { handleErrorWithToast } from "ui/shared-toast";
import { useAgents } from "@/hooks/queries/use-agents";
import { redriectMcpOauth } from "lib/ai/mcp/oauth-redirect";
import { GeminiIcon } from "ui/gemini-icon";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { OpenAIIcon } from "ui/openai-icon";

interface ToolSelectDropdownProps {
  align?: "start" | "end" | "center";
  side?: "left" | "right" | "top" | "bottom";
  disabled?: boolean;
  mentions?: ChatMention[];
  onSelectWorkflow?: (workflow: WorkflowSummary) => void;
  onSelectAgent?: (agent: AgentSummary) => void;
  onGenerateImage?: (provider?: "google" | "openai") => void;
  className?: string;
}

const calculateToolCount = (
  allowedMcpServers: Record<string, AllowedMCPServer> = {},
  allowedAppDefaultToolkit: AppDefaultToolkit[] = [],
) => {
  const mcpServerCount = Object.values(allowedMcpServers).filter(
    (server) => (server?.tools?.length ?? 0) > 0,
  ).length;
  const appToolkitCount = new Set(
    allowedAppDefaultToolkit.filter(
      (toolkit) => Object.keys(APP_DEFAULT_TOOL_KIT[toolkit] ?? {}).length > 0,
    ),
  ).size;

  return mcpServerCount + appToolkitCount;
};

const APP_TOOLKIT_ICONS: Record<AppDefaultToolkit, LucideIcon> = {
  [AppDefaultToolkit.Visualization]: ChartColumn,
  [AppDefaultToolkit.WebSearch]: GlobeIcon,
  [AppDefaultToolkit.Http]: HardDriveUploadIcon,
  [AppDefaultToolkit.Code]: CodeIcon,
};

type ToolPreview = {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  toolNames: string[];
};

const toolCountLabel = (count: number) =>
  `${count} ${count === 1 ? "tool" : "tools"}`;

function ToolNamesTooltip({
  children,
  toolNames,
}: {
  children: ReactNode;
  toolNames: string[];
}) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClickRef = useRef(false);

  const clearHoldTimeout = useCallback(() => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => clearHoldTimeout, [clearHoldTimeout]);

  if (toolNames.length <= 1) return <>{children}</>;

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <span
          onPointerEnter={() => setOpen(true)}
          onPointerLeave={() => setOpen(false)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onPointerDown={(event) => {
            if (event.pointerType !== "touch") return;
            clearHoldTimeout();
            holdTimeoutRef.current = setTimeout(() => {
              suppressClickRef.current = true;
              setOpen(true);
            }, 450);
          }}
          onPointerUp={() => {
            clearHoldTimeout();
            if (suppressClickRef.current) setOpen(false);
          }}
          onPointerCancel={() => {
            clearHoldTimeout();
            setOpen(false);
            suppressClickRef.current = false;
          }}
          onClick={(event) => {
            if (!suppressClickRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            suppressClickRef.current = false;
          }}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side={isMobile ? "top" : "right"}
        align="center"
        sideOffset={isMobile ? 10 : 8}
        collisionPadding={12}
        className="max-w-72 space-y-1.5 p-2.5 [&>svg]:hidden"
      >
        <p className="text-[11px] font-medium text-muted-foreground">
          {toolCountLabel(toolNames.length)}
        </p>
        <div className="flex flex-wrap gap-1">
          {toolNames.map((toolName) => (
            <span
              key={toolName}
              className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground"
            >
              {toolName}
            </span>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

const MotionButton = motion.create(Button);

type SelectedToolsPreviewProps = {
  tools: ToolPreview[];
};

function SelectedToolsPreview({ tools }: SelectedToolsPreviewProps): ReactNode {
  const visibleTools = tools.slice(0, 3);
  const overflowCount = tools.length - visibleTools.length;

  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap max-sm:gap-1">
      <Wrench className="size-3.5 text-muted-foreground" />
      <span aria-hidden="true" className="h-4 w-px bg-border max-sm:h-3" />
      <span
        aria-hidden="true"
        className="flex items-center -space-x-1.5 max-sm:-space-x-2.5"
      >
        {visibleTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <span
              key={tool.key}
              className="relative flex size-5 items-center justify-center rounded-full border border-border/60 bg-background/29 text-foreground shadow-xs backdrop-blur-sm max-sm:size-[18px]"
            >
              <Icon className="size-3 max-sm:size-2.5" />
            </span>
          );
        })}
      </span>
      {overflowCount > 0 && (
        <span className="-ml-[1.2px] flex h-5 min-w-4 items-center justify-center text-[11px] leading-none text-muted-foreground tabular-nums max-sm:h-4 max-sm:min-w-3.5 max-sm:text-[10px]">
          +{overflowCount}
        </span>
      )}
    </span>
  );
}

type ToolTriggerContentProps = {
  isLoading: boolean;
  isAgentMention: boolean;
  hasMention: boolean;
  showSelectedTools: boolean;
  selectedTools: ToolPreview[];
};

function ToolTriggerContent({
  isLoading,
  isAgentMention,
  hasMention,
  showSelectedTools,
  selectedTools,
}: ToolTriggerContentProps): ReactNode {
  if (isLoading) {
    return (
      <>
        <span>Tools</span>
        <Loader className="size-3.5 animate-spin" />
      </>
    );
  }
  if (isAgentMention) return "Agent";
  if (hasMention) {
    return (
      <>
        <span>Mention</span>
        <AtSign className="size-3.5" />
      </>
    );
  }
  if (showSelectedTools) {
    return <SelectedToolsPreview tools={selectedTools} />;
  }
  return (
    <span className="inline-flex items-center gap-1.5 leading-none text-muted-foreground">
      <Wrench className="size-3.5 shrink-0 opacity-50" />
      <span className="hidden text-xs leading-none opacity-60 sm:inline">
        None
      </span>
    </span>
  );
}

export function ToolSelectDropdown({
  align,
  side,
  onSelectWorkflow,
  onSelectAgent,
  onGenerateImage,
  mentions,
  className,
}: ToolSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [hasOpenMobileSubmenu, setHasOpenMobileSubmenu] = useState(false);
  const [toolChoice, allowedAppDefaultToolkit, allowedMcpServers, mcpList] =
    appStore(
      useShallow((state) => [
        state.toolChoice,
        state.allowedAppDefaultToolkit,
        state.allowedMcpServers,
        state.mcpList,
      ]),
    );

  const t = useTranslations("Chat.Tool");
  const { isLoading } = useMcpList();
  const { data: providers } = useChatModels();
  const [globalModel] = appStore(useShallow((state) => [state.chatModel]));

  const modelInfo = useMemo(() => {
    const provider = providers?.find(
      (provider) => provider.provider === globalModel?.provider,
    );
    const model = provider?.models.find(
      (model) => model.name === globalModel?.model,
    );
    return model;
  }, [providers, globalModel]);

  useWorkflowToolList({
    refreshInterval: 1000 * 60 * 5,
  });

  const agentMention = useMemo(() => {
    return mentions?.find((m) => m.type === "agent");
  }, [mentions]);

  const selectedToolPreviews = useMemo<ToolPreview[]>(() => {
    if (mentions?.length || toolChoice == "none") return [];

    const translate = t.raw("defaultToolKit");
    const defaultTools = Object.values(AppDefaultToolkit)
      .filter((toolkit) => allowedAppDefaultToolkit?.includes(toolkit))
      .map((toolkit) => ({
        key: `default:${toolkit}`,
        label: translate[toolkit],
        icon: APP_TOOLKIT_ICONS[toolkit],
        toolNames: Object.keys(APP_DEFAULT_TOOL_KIT[toolkit] ?? {}),
      }));

    const mcpTools = Object.entries(allowedMcpServers ?? {}).flatMap(
      ([serverId, server]) => {
        const serverInfo = mcpList.find((server) => server.id === serverId);
        if (!serverInfo || !server?.tools?.length) return [];

        const availableTools = new Set(
          serverInfo.toolInfo.map((tool) => tool.name),
        );
        const toolNames = server.tools.filter((toolName) =>
          availableTools.has(toolName),
        );
        if (toolNames.length === 0) return [];

        const toolDescriptions = serverInfo.toolInfo
          .filter((tool) => toolNames.includes(tool.name))
          .map((tool) => tool.description ?? "");

        return [
          {
            key: `mcp:${serverId}`,
            label: serverInfo.name,
            icon: resolveMcpIcon(serverInfo.name, [
              ...toolNames,
              ...toolDescriptions,
            ]),
            toolNames,
          },
        ];
      },
    );

    return [...defaultTools, ...mcpTools];
  }, [
    mentions,
    toolChoice,
    t,
    allowedAppDefaultToolkit,
    mcpList,
    allowedMcpServers,
  ]);

  const bindingTools = useMemo<string[]>(() => {
    if (mentions?.length) return mentions.map((mention) => mention.name);
    return selectedToolPreviews.map((tool) => tool.label);
  }, [mentions, selectedToolPreviews]);

  const hasMention = (mentions?.length ?? 0) > 0;
  const selectedToolCount = selectedToolPreviews.length;
  const showSelectedTools =
    !agentMention && !hasMention && selectedToolCount > 0 && !isLoading;

  const triggerButton = useMemo(() => {
    return (
      <MotionButton
        aria-label={
          showSelectedTools
            ? `${selectedToolCount} ${selectedToolCount === 1 ? "tool" : "tools"} selected`
            : undefined
        }
        layout="size"
        transition={{
          layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
        }}
        variant="ghost"
        size={"sm"}
        className={cn(
          "gap-1.5 rounded-full border bg-input/60 px-2.5 transition-[background-color,color,border-color] duration-200 data-[state=open]:bg-input! hover:bg-input!",
          !bindingTools.length &&
            !isLoading &&
            "text-muted-foreground bg-transparent border-transparent",
          isLoading && "bg-input/60",
          open && "bg-input!",
          className,
        )}
      >
        <ToolTriggerContent
          isLoading={isLoading}
          isAgentMention={Boolean(agentMention)}
          hasMention={hasMention}
          showSelectedTools={showSelectedTools}
          selectedTools={selectedToolPreviews}
        />
      </MotionButton>
    );
  }, [
    agentMention,
    bindingTools.length,
    className,
    hasMention,
    isLoading,
    open,
    selectedToolPreviews,
    selectedToolCount,
    showSelectedTools,
  ]);

  useEffect(() => {
    if (selectedToolCount > 128) {
      toast("Too many tools selected, please select less than 128 tools");
    }
  }, [selectedToolCount > 128]);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && hasOpenMobileSubmenu) {
          return;
        }
        setOpen(nextOpen);
      }}
    >
      <DropdownMenuTrigger asChild>
        <div>{triggerButton}</div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="md:w-72" align={align} side={side}>
        <MobileSubmenuProvider
          onOpenSubmenuChange={setHasOpenMobileSubmenu}
          requestCloseParent={() => {
            setHasOpenMobileSubmenu(false);
            setOpen(false);
          }}
        >
          <WorkflowToolSelector onSelectWorkflow={onSelectWorkflow} />
          <div className="py-1">
            <DropdownMenuSeparator />
          </div>
          <AgentSelector onSelectAgent={onSelectAgent} />
          <div className="py-1">
            <DropdownMenuSeparator />
          </div>
          <ImageGeneratorSelector
            onGenerateImage={onGenerateImage}
            modelInfo={modelInfo}
          />
          <div className="py-1">
            <DropdownMenuSeparator />
          </div>
          <div className="py-2">
            <ToolPresets />
            <div className="py-1">
              <DropdownMenuSeparator />
            </div>
            <AppDefaultToolKitSelector />
            <div className="py-1">
              <DropdownMenuSeparator />
            </div>
            <McpServerSelector />
          </div>
        </MobileSubmenuProvider>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToolPresets() {
  const [appStoreMutate, presets, allowedMcpServers, allowedAppDefaultToolkit] =
    appStore(
      useShallow((state) => [
        state.mutate,
        state.toolPresets,
        state.allowedMcpServers,
        state.allowedAppDefaultToolkit,
      ]),
    );
  const [open, setOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const t = useTranslations();

  const presetWithToolCount = useMemo(() => {
    return presets.map((preset) => ({
      ...preset,
      toolCount: calculateToolCount(
        preset.allowedMcpServers ?? {},
        preset.allowedAppDefaultToolkit ?? [],
      ),
    }));
  }, [presets]);

  const addPreset = useCallback(
    (name: string) => {
      if (name.trim() === "") {
        toast.error(t("Chat.Tool.presetNameCannotBeEmpty"));
        return;
      }
      if (presets.find((p) => p.name === name)) {
        toast.error(t("Chat.Tool.presetNameAlreadyExists"));
        return;
      }
      appStoreMutate((prev) => {
        return {
          toolPresets: [
            ...prev.toolPresets,
            { name, allowedMcpServers, allowedAppDefaultToolkit },
          ],
        };
      });
      setPresetName("");
      setOpen(false);
      toast.success(t("Chat.Tool.presetSaved"));
    },
    [allowedMcpServers, allowedAppDefaultToolkit, presets],
  );

  const deletePreset = useCallback((index: number) => {
    appStoreMutate((prev) => {
      return {
        toolPresets: prev.toolPresets.filter((_, i) => i !== index),
      };
    });
  }, []);

  const applyPreset = useCallback((preset: (typeof presets)[number]) => {
    const selectedTools = Object.fromEntries(
      Object.entries(preset.allowedMcpServers ?? {}).map(
        ([serverId, server]) => [serverId, server.tools],
      ),
    );

    appStoreMutate((prev) => ({
      allowedMcpServers: preset.allowedMcpServers,
      allowedAppDefaultToolkit: preset.allowedAppDefaultToolkit,
      mcpToolSelections: {
        ...prev.mcpToolSelections,
        ...selectedTools,
      },
    }));
    toast.success(`Preset "${preset.name}" applied`);
  }, []);

  return (
    <DropdownMenuGroup className="cursor-pointer">
      <MobileAwareSubmenu
        trigger={
          <>
            <Package className="size-3.5" />
            <span className="text-xs font-semibold">
              {t("Chat.Tool.preset")}
            </span>
          </>
        }
        triggerClassName="text-xs flex items-center gap-2 font-semibold cursor-pointer"
        contentClassName="md:w-80 md:max-h-96 overflow-y-auto"
        title="Tool Presets"
      >
        <div className="w-full">
          <DropdownMenuLabel className="flex items-center text-muted-foreground gap-2 text-xs">
            {t("Chat.Tool.toolPresets")}
            <div className="flex-1" />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant={"secondary"} size={"sm"} className="text-xs">
                  {t("Chat.Tool.saveAsPreset")}
                  <Plus className="size-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="z-[11000]">
                <DialogHeader>
                  <DialogTitle>{t("Chat.Tool.saveAsPreset")}</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  {t("Chat.Tool.saveAsPresetDescription")}
                </DialogDescription>
                <Input
                  placeholder="Preset Name"
                  value={presetName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      addPreset(presetName);
                    }
                  }}
                  onChange={(e) => setPresetName(e.target.value)}
                />
                <Button
                  variant={"secondary"}
                  size={"sm"}
                  className="border"
                  onClick={() => {
                    addPreset(presetName);
                  }}
                >
                  {t("Common.save")}
                </Button>
              </DialogContent>
            </Dialog>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {presets.length === 0 ? (
            <div className="text-sm text-muted-foreground w-full h-full flex flex-col items-center justify-center gap-2 py-6">
              <p>{t("Chat.Tool.noPresetsAvailableYet")}</p>
              <p className="text-xs px-4">
                {t("Chat.Tool.clickSaveAsPresetToGetStarted")}
              </p>
            </div>
          ) : (
            presetWithToolCount.map((preset, index) => {
              return (
                <MobileCompatibleMenuItem
                  onClick={() => {
                    applyPreset(preset);
                  }}
                  key={preset.name}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Badge
                    variant={"secondary"}
                    className="rounded-full border-input"
                  >
                    <Wrench className="size-3.5" />
                    <span className="min-w-6 text-center">
                      {preset.toolCount}
                    </span>
                  </Badge>
                  <span className="font-semibold truncate">{preset.name}</span>

                  <div className="flex-1" />
                  <div
                    className="p-1 hover:bg-input rounded-full cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      deletePreset(index);
                    }}
                  >
                    <X className="size-3.5" />
                  </div>
                </MobileCompatibleMenuItem>
              );
            })
          )}
        </div>
      </MobileAwareSubmenu>
    </DropdownMenuGroup>
  );
}

function WorkflowToolSelector({
  onSelectWorkflow,
}: {
  onSelectWorkflow?: (workflow: WorkflowSummary) => void;
}) {
  const t = useTranslations();
  const workflowToolList = appStore((state) => state.workflowToolList);
  const { data: session } = authClient.useSession();
  const currentUserId = session?.user?.id;

  // Separate user's workflows from shared workflows
  const myWorkflows = workflowToolList.filter(
    (w) => w.userId === currentUserId,
  );
  const sharedWorkflows = workflowToolList.filter(
    (w) => w.userId !== currentUserId,
  );
  return (
    <DropdownMenuGroup>
      <MobileAwareSubmenu
        trigger={
          <>
            <Waypoints className="size-3.5" />
            <span className="text-xs font-semibold">{t("Workflow.title")}</span>
          </>
        }
        triggerClassName="text-xs flex items-center gap-2 font-semibold cursor-pointer"
        contentClassName="w-80 relative"
        title="Workflows"
      >
        <div className="w-full">
          {myWorkflows.length === 0 && sharedWorkflows.length === 0 ? (
            <div className="text-sm text-muted-foreground flex flex-col py-6 px-6 gap-4 items-center">
              <InfoIcon className="size-4" />
              <p className="whitespace-pre-wrap">{t("Workflow.noTools")}</p>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant={"ghost"} className="relative group">
                    {t("Workflow.whatIsWorkflow")}
                    <div className="absolute left-0 -top-1.5 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                      <MousePointer2 className="rotate-180 text-blue-500 fill-blue-500 size-3 wiggle" />
                    </div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="md:max-w-3xl!">
                  <DialogTitle className="sr-only">
                    workflow greeting
                  </DialogTitle>
                  <WorkflowGreeting />
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <>
              {/* My Workflows */}
              {myWorkflows.map((workflow) => (
                <MobileCompatibleMenuItem
                  key={workflow.id}
                  className="cursor-pointer"
                  onClick={() => onSelectWorkflow?.(workflow)}
                >
                  {workflow.icon && workflow.icon.type === "emoji" ? (
                    <div
                      style={{
                        backgroundColor: workflow.icon?.style?.backgroundColor,
                      }}
                      className="p-1 rounded flex items-center justify-center ring ring-background border"
                    >
                      <Avatar className="size-3">
                        <AvatarImage src={workflow.icon?.value} />
                        <AvatarFallback>
                          {workflow.name.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : null}
                  <span className="truncate min-w-0">{workflow.name}</span>
                </MobileCompatibleMenuItem>
              ))}

              {myWorkflows.length > 0 && sharedWorkflows.length > 0 && (
                <DropdownMenuSeparator />
              )}

              {/* Shared Workflows */}
              {sharedWorkflows.map((workflow) => (
                <MobileCompatibleMenuItem
                  key={workflow.id}
                  className="cursor-pointer"
                  onClick={() => onSelectWorkflow?.(workflow)}
                >
                  {workflow.icon && workflow.icon.type === "emoji" ? (
                    <div
                      style={{
                        backgroundColor: workflow.icon?.style?.backgroundColor,
                      }}
                      className="p-1 rounded flex items-center justify-center ring ring-background border"
                    >
                      <Avatar className="size-3">
                        <AvatarImage src={workflow.icon?.value} />
                        <AvatarFallback>
                          {workflow.name.slice(0, 1)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="truncate min-w-0">{workflow.name}</span>
                    {workflow.userName && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Avatar className="size-4 ml-2 shrink-0">
                            <AvatarImage src={workflow.userAvatar} />
                            <AvatarFallback className="text-xs text-muted-foreground font-medium">
                              {workflow.userName[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          {t("Common.sharedBy", {
                            userName: workflow.userName,
                          })}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </MobileCompatibleMenuItem>
              ))}
            </>
          )}
        </div>
      </MobileAwareSubmenu>
    </DropdownMenuGroup>
  );
}

function McpServerSelector() {
  const [appStoreMutate, allowedMcpServers, mcpServerList] = appStore(
    useShallow((state) => [
      state.mutate,
      state.allowedMcpServers,
      state.mcpList,
    ]),
  );

  const selectedMcpServerList = useMemo(() => {
    if (mcpServerList.length === 0) return [];
    return [...mcpServerList]
      .sort(
        (a, b) =>
          (a.status === "connected" ? -1 : 1) -
          (b.status === "connected" ? -1 : 1),
      )
      .map((server) => {
        const allowedTools: string[] =
          allowedMcpServers?.[server.id]?.tools ?? [];

        return {
          id: server.id,
          serverName: server.name,
          checked: allowedTools.length > 0,
          tools: server.toolInfo.map((tool) => tool.name),
          error: server.error,
          status: server.status,
        };
      });
  }, [mcpServerList, allowedMcpServers]);

  const handleAuthorize = useCallback((serverId: string) => {
    safe(() => redriectMcpOauth(serverId))
      .ifOk(() => mutate("/api/mcp/list"))
      .ifFail(handleErrorWithToast);
  }, []);

  const toggleMcpServer = useCallback(
    (serverId: string, availableToolNames: string[]) => {
      appStoreMutate((prev) => {
        const currentTools = prev.allowedMcpServers?.[serverId]?.tools;
        const configuredTools =
          prev.mcpToolSelections?.[serverId] ??
          currentTools ??
          availableToolNames;
        const shouldEnable = !currentTools?.length;
        const toolsToUse =
          shouldEnable && configuredTools.length === 0
            ? availableToolNames
            : configuredTools;

        const nextAllowedMcpServers = { ...(prev.allowedMcpServers ?? {}) };
        if (shouldEnable) {
          nextAllowedMcpServers[serverId] = {
            ...(nextAllowedMcpServers[serverId] ?? {}),
            tools: toolsToUse,
          };
        } else {
          delete nextAllowedMcpServers[serverId];
        }

        return {
          allowedMcpServers:
            Object.keys(nextAllowedMcpServers).length > 0
              ? nextAllowedMcpServers
              : undefined,
          mcpToolSelections: {
            ...(prev.mcpToolSelections ?? {}),
            [serverId]: toolsToUse,
          },
        };
      });
    },
    [],
  );
  return (
    <DropdownMenuGroup>
      {!selectedMcpServerList.length ? (
        <div className="text-sm text-muted-foreground w-full h-full flex flex-col items-center justify-center py-6">
          <div>No MCP servers detected.</div>
          <Link href="/mcp">
            <Button
              variant={"ghost"}
              className="mt-2 text-primary flex items-center gap-1"
            >
              Add a server <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      ) : (
        selectedMcpServerList.map((server) => {
          const ServerIcon = resolveMcpIcon(server.serverName, server.tools);

          return (
            <MobileCompatibleMenuItem
              key={server.id}
              disabled={
                server.status === "loading" || server.tools.length === 0
              }
              className={cn(
                "group cursor-pointer font-semibold text-xs text-muted-foreground",
                server.checked && "text-foreground",
              )}
              onClick={(e) => {
                e.preventDefault();
                if (server.status === "authorizing") {
                  handleAuthorize(server.id);
                  return;
                }
                toggleMcpServer(server.id, server.tools);
              }}
            >
              <ServerIcon className="size-3.5" />
              <span className="min-w-0 flex-1 truncate">
                {server.serverName}
              </span>
              {Boolean(server.error) ? (
                <span className="ml-1 rounded p-1 text-xs text-destructive">
                  error
                </span>
              ) : null}
              {server.status === "authorizing" ? (
                <ShieldAlertIcon className="size-3 text-muted-foreground" />
              ) : (
                <Switch
                  className="ml-auto"
                  checked={server.checked}
                  disabled={
                    server.status === "loading" || server.tools.length === 0
                  }
                  onCheckedChange={() =>
                    toggleMcpServer(server.id, server.tools)
                  }
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`${server.serverName}: ${server.checked ? "enabled" : "disabled"}`}
                />
              )}
            </MobileCompatibleMenuItem>
          );
        })
      )}
    </DropdownMenuGroup>
  );
}

function AppDefaultToolKitSelector() {
  const [appStoreMutate, allowedAppDefaultToolkit] = appStore(
    useShallow((state) => [state.mutate, state.allowedAppDefaultToolkit]),
  );
  const t = useTranslations();
  const toggleAppDefaultToolkit = useCallback((toolkit: AppDefaultToolkit) => {
    appStoreMutate((prev) => {
      const newAllowedAppDefaultToolkit = [
        ...(prev.allowedAppDefaultToolkit ?? []),
      ];
      if (newAllowedAppDefaultToolkit.includes(toolkit)) {
        newAllowedAppDefaultToolkit.splice(
          newAllowedAppDefaultToolkit.indexOf(toolkit),
          1,
        );
      } else {
        newAllowedAppDefaultToolkit.push(toolkit);
      }
      return { allowedAppDefaultToolkit: newAllowedAppDefaultToolkit };
    });
  }, []);

  const defaultToolInfo = useMemo(() => {
    const raw = t.raw("Chat.Tool.defaultToolKit");
    return Object.values(AppDefaultToolkit).map((toolkit) => {
      const label = raw[toolkit] || toolkit;
      const id = toolkit;
      const icon = APP_TOOLKIT_ICONS[toolkit];
      const toolNames = Object.keys(APP_DEFAULT_TOOL_KIT[toolkit] ?? {});
      return {
        label,
        id,
        icon,
        toolNames,
      };
    });
  }, []);

  return (
    <DropdownMenuGroup>
      {defaultToolInfo.map((tool) => {
        return (
          <MobileCompatibleMenuItem
            key={tool.id}
            className={cn(
              "group cursor-pointer font-semibold text-xs text-muted-foreground",
              allowedAppDefaultToolkit?.includes(tool.id) && "text-foreground",
            )}
            onClick={(e) => {
              e.preventDefault();
              toggleAppDefaultToolkit(tool.id);
            }}
          >
            <ToolNamesTooltip toolNames={tool.toolNames}>
              <span className="inline-flex min-w-0 items-center gap-2">
                <tool.icon
                  className={cn(
                    "size-3.5",
                    allowedAppDefaultToolkit?.includes(tool.id) &&
                      "text-foreground",
                  )}
                />
                <span>{tool.label}</span>
              </span>
            </ToolNamesTooltip>
            <Switch
              className="ml-auto"
              checked={allowedAppDefaultToolkit?.includes(tool.id)}
            />
          </MobileCompatibleMenuItem>
        );
      })}
    </DropdownMenuGroup>
  );
}

function AgentSelector({
  onSelectAgent,
}: {
  onSelectAgent?: (agent: AgentSummary) => void;
}) {
  const t = useTranslations();
  const { myAgents, bookmarkedAgents } = useAgents({
    filters: ["mine", "bookmarked"],
  });

  const emptyAgent = useMemo(() => {
    if (myAgents.length + bookmarkedAgents.length > 0) return null;
    return (
      <Link
        href={"/agent/new"}
        className="py-8 px-4 hover:bg-input/100 rounded-lg cursor-pointer flex justify-between items-center text-xs overflow-hidden"
      >
        <div className="gap-1 z-10">
          <div className="flex items-center mb-4 gap-1">
            <p className="font-semibold">{t("Layout.createAgent")}</p>
            <ArrowUpRightIcon className="size-3" />
          </div>
          <p className="text-muted-foreground">
            {bookmarkedAgents.length > 0
              ? t("Layout.createYourOwnAgentOrSelectShared")
              : t("Layout.createYourOwnAgent")}
          </p>
        </div>
      </Link>
    );
  }, [myAgents.length, bookmarkedAgents.length, t]);

  return (
    <DropdownMenuGroup>
      <MobileAwareSubmenu
        trigger={
          <>
            <MessageCircle className="size-3.5" />
            <span className="text-xs font-semibold">{t("Agent.title")}</span>
          </>
        }
        triggerClassName="text-xs flex items-center gap-2 font-semibold cursor-pointer"
        contentClassName="w-80 relative"
        title="Agents"
      >
        <div className="w-full">
          {emptyAgent}

          {/* My Agents */}
          {myAgents.map((agent) => (
            <MobileCompatibleMenuItem
              key={agent.id}
              className="cursor-pointer"
              onClick={() => onSelectAgent?.(agent)}
            >
              {agent.icon && agent.icon.type === "emoji" ? (
                <div
                  style={{
                    backgroundColor: agent.icon?.style?.backgroundColor,
                  }}
                  className="p-1 rounded flex items-center justify-center ring ring-background border"
                >
                  <Avatar className="size-3">
                    <AvatarImage src={agent.icon?.value} />
                    <AvatarFallback>{agent.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </div>
              ) : null}
              <span className="truncate min-w-0">{agent.name}</span>
            </MobileCompatibleMenuItem>
          ))}

          {myAgents.length > 0 && bookmarkedAgents.length > 0 && (
            <DropdownMenuSeparator />
          )}

          {bookmarkedAgents.map((agent) => (
            <MobileCompatibleMenuItem
              key={agent.id}
              className="cursor-pointer"
              onClick={() => onSelectAgent?.(agent)}
            >
              {agent.icon && agent.icon.type === "emoji" ? (
                <div
                  style={{
                    backgroundColor: agent.icon?.style?.backgroundColor,
                  }}
                  className="p-1 rounded flex items-center justify-center ring ring-background border"
                >
                  <Avatar className="size-3">
                    <AvatarImage src={agent.icon?.value} />
                    <AvatarFallback>{agent.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                </div>
              ) : null}
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate min-w-0">{agent.name}</span>
                {agent.userName && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Avatar className="size-4 ml-2 shrink-0">
                        <AvatarImage src={agent.userAvatar} />
                        <AvatarFallback className="text-xs text-muted-foreground font-medium">
                          {agent.userName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("Common.sharedBy", { userName: agent.userName })}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </MobileCompatibleMenuItem>
          ))}
        </div>
      </MobileAwareSubmenu>
    </DropdownMenuGroup>
  );
}

function ImageGeneratorSelector({
  onGenerateImage,
  modelInfo,
}: {
  onGenerateImage?: (provider?: "google" | "openai") => void;
  modelInfo?: { isToolCallUnsupported?: boolean };
}) {
  const t = useTranslations("Chat");

  return (
    <DropdownMenuGroup>
      <MobileAwareSubmenu
        trigger={
          <>
            <ImagesIcon className="size-3.5" />
            {t("generateImage")}
          </>
        }
        triggerClassName="text-xs flex items-center gap-2 font-semibold cursor-pointer"
        title="Generate Image"
      >
        <MobileCompatibleMenuItem
          disabled={modelInfo?.isToolCallUnsupported}
          onClick={() => onGenerateImage?.("google")}
          className="cursor-pointer"
        >
          <GeminiIcon className="mr-2 size-4" />
          Gemini (Nano Banana)
        </MobileCompatibleMenuItem>
        <MobileCompatibleMenuItem
          disabled={modelInfo?.isToolCallUnsupported}
          onClick={() => onGenerateImage?.("openai")}
          className="cursor-pointer"
        >
          <OpenAIIcon className="mr-2 size-4" />
          OpenAI
        </MobileCompatibleMenuItem>
      </MobileAwareSubmenu>
    </DropdownMenuGroup>
  );
}
