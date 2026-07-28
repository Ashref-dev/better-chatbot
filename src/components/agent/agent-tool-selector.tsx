"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChatMention } from "app-types/chat";
import { DefaultToolName } from "lib/ai/tools";
import { cn, noop } from "lib/utils";
import equal from "lib/equal";
import { ChevronDownIcon, HammerIcon, Loader } from "lucide-react";
import { ChatMentionInputSuggestion } from "@/components/chat-mention-input";
import { DefaultToolIcon } from "@/components/default-tool-icon";
import { MCPIcon } from "ui/mcp-icon";
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar";

const MAX_VISIBLE_TOOLS = 10;

interface AgentToolSelectorProps {
  mentions: ChatMention[];
  isLoading?: boolean;
  disabled?: boolean;
  hasEditAccess?: boolean;
  onChange: (mentions: ChatMention[]) => void;
}

function MentionIcon({ mention }: { mention: ChatMention }) {
  if (mention.type === "defaultTool") {
    return (
      <DefaultToolIcon
        name={mention.name as DefaultToolName}
        className="size-3.5"
      />
    );
  }

  if (mention.type === "mcpServer" || mention.type === "mcpTool") {
    return <MCPIcon className="size-3.5" />;
  }

  if (mention.type === "workflow") {
    return (
      <Avatar
        style={mention.icon?.style}
        className="size-4 rounded-full ring-1 ring-input"
      >
        <AvatarImage src={mention.icon?.value} />
        <AvatarFallback>{mention.name.slice(0, 1)}</AvatarFallback>
      </Avatar>
    );
  }

  return <HammerIcon className="size-3.5" />;
}

export function AgentToolSelector({
  mentions,
  isLoading = false,
  disabled = false,
  hasEditAccess = true,
  onChange,
}: AgentToolSelectorProps) {
  const t = useTranslations();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const triggerRect = useMemo(() => {
    return triggerRef.current?.getBoundingClientRect();
  }, [open]);

  const handleSelectMention = useCallback(
    (item: { label: string; id: string }) => {
      const mention = JSON.parse(item.id) as ChatMention;
      const newMentions = [...mentions];
      const index = newMentions.findIndex((m) => equal(m, mention));

      if (index !== -1) {
        newMentions.splice(index, 1);
      } else {
        newMentions.push(mention);
      }

      onChange(newMentions);
    },
    [mentions, onChange],
  );

  const handleDeleteMention = useCallback(
    (mention: ChatMention) => {
      onChange(mentions.filter((m) => !equal(m, mention)));
    },
    [mentions, onChange],
  );

  const selectedIds = useMemo(() => {
    return mentions.map((m) => JSON.stringify(m));
  }, [mentions]);

  const selectedMentions = useMemo(() => {
    const visibleMentions = mentions.slice(0, MAX_VISIBLE_TOOLS);
    const overflowCount = mentions.length - visibleMentions.length;

    return (
      <div
        className="flex min-w-0 items-center -space-x-2 py-0.5"
        aria-label={`${mentions.length} selected`}
      >
        {visibleMentions.map((mention) => {
          const key = JSON.stringify(mention);
          const chipClassName = cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-foreground shadow-sm backdrop-blur-sm transition-[transform,border-color,background-color]",
            hasEditAccess &&
              "group cursor-pointer hover:z-10 hover:scale-105 hover:border-destructive/50 hover:bg-background focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          );

          if (!hasEditAccess) {
            return (
              <span key={key} className={chipClassName} title={mention.name}>
                <MentionIcon mention={mention} />
              </span>
            );
          }

          return (
            <button
              key={key}
              type="button"
              className={chipClassName}
              title={mention.name}
              aria-label={`${t("Common.delete")} ${mention.name}`}
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteMention(mention);
              }}
            >
              <MentionIcon mention={mention} />
            </button>
          );
        })}
        {overflowCount > 0 && (
          <span className="relative z-10 flex h-8 min-w-8 items-center justify-center rounded-full border border-border/70 bg-muted px-1.5 text-[10px] font-medium text-muted-foreground shadow-sm tabular-nums">
            +{overflowCount}
          </span>
        )}
      </div>
    );
  }, [mentions, hasEditAccess, handleDeleteMention, t]);

  return (
    <ChatMentionInputSuggestion
      onSelectMention={handleSelectMention}
      onClose={noop}
      open={open && hasEditAccess && !disabled}
      disabledType={["agent"]}
      onOpenChange={(newOpen) => hasEditAccess && !disabled && setOpen(newOpen)}
      top={0}
      left={0}
      selectedIds={selectedIds}
      style={{
        width: triggerRect?.width ?? 0,
      }}
    >
      <div
        className={cn(
          "flex min-h-14 w-full min-w-0 items-center justify-start gap-3 rounded-md bg-secondary px-3 py-2.5 transition-colors",
          hasEditAccess && !disabled && "hover:bg-input cursor-pointer",
        )}
        ref={triggerRef}
        id="agent-tool-bindings"
        aria-describedby="agent-tools-help"
      >
        <div className="mr-auto flex min-w-0 items-center">
          {isLoading ? (
            <span className="text-sm text-muted-foreground">
              {t("Agent.loadingTools")}
            </span>
          ) : mentions.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              {t("Agent.addTools")}
            </span>
          ) : (
            selectedMentions
          )}
        </div>
        {isLoading ? (
          <Loader className="size-4 animate-spin" />
        ) : (
          <ChevronDownIcon
            className={cn("size-4 transition-transform", open && "rotate-180")}
          />
        )}
      </div>
    </ChatMentionInputSuggestion>
  );
}
