"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AutoHeight } from "ui/auto-height";

import { appStore } from "@/app/store";
import { authClient } from "auth/client";
import { hasFullModelAccess } from "lib/ai/model-access";
import { Shortcuts, isShortcutEvent } from "lib/keyboard-shortcuts";
import {
  Boxes,
  ChevronLeft,
  ChevronRight,
  Share2,
  Sparkles,
  Tags,
  UserIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "ui/drawer";
import { MCPIcon } from "ui/mcp-icon";
import { useShallow } from "zustand/shallow";
import { BackgroundEffectsContent } from "./background-effects-content";
import {
  ExportsManagementContent,
  MCPInstructionsContent,
  UserInstructionsContent,
} from "./chat-preferences-content";
import { CustomModelsContent } from "./custom-models-content";
import { ModelLabelsContent } from "./model-labels-content";

type PreferenceTabId =
  | "userInstructions"
  | "mcpInstructions"
  | "exports"
  | "modelCatalog"
  | "modelLabels"
  | "backgroundEffects";

const MOBILE_TAB_TRANSITION_MS = 300;

export function ChatPreferencesPopup() {
  const { data: session } = authClient.useSession();
  const canManageModels = hasFullModelAccess(session?.user.role);
  const [openChatPreferences, chatPreferencesTab, appStoreMutate] = appStore(
    useShallow((state) => [
      state.openChatPreferences,
      state.chatPreferencesTab,
      state.mutate,
    ]),
  );

  const t = useTranslations();

  const tabs = useMemo(() => {
    return [
      {
        id: "userInstructions" as const,
        label: t("Chat.ChatPreferences.userInstructions"),
        icon: <UserIcon className="w-4 h-4" />,
      },
      {
        id: "mcpInstructions" as const,
        label: t("Chat.ChatPreferences.mcpInstructions"),
        icon: <MCPIcon className="w-4 h-4 fill-muted-foreground" />,
      },
      {
        id: "exports" as const,
        label: t("Chat.ChatPreferences.myExports"),
        icon: <Share2 className="w-4 h-4" />,
      },
      ...(canManageModels
        ? [
            {
              id: "modelCatalog" as const,
              label: "Model Catalog",
              icon: <Boxes className="w-4 h-4" />,
            },
            {
              id: "modelLabels" as const,
              label: "Model Labels",
              icon: <Tags className="w-4 h-4" />,
            },
          ]
        : []),
      {
        id: "backgroundEffects" as const,
        label: "Background Effects",
        icon: <Sparkles className="w-4 h-4" />,
      },
    ];
  }, [canManageModels, t]);

  const [tab, setTab] = useState(0);

  const handleClose = () => {
    appStoreMutate({ openChatPreferences: false });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isChatPreferencesEvent = isShortcutEvent(
        e,
        Shortcuts.openChatPreferences,
      );
      if (isChatPreferencesEvent) {
        e.preventDefault();
        e.stopPropagation();
        appStoreMutate((prev) => ({
          openChatPreferences: !prev.openChatPreferences,
        }));
      }

      // ESC key to close
      if (e.key === "Escape" && openChatPreferences) {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openChatPreferences]);

  useEffect(() => {
    if (!openChatPreferences) {
      setTab(0);
      appStoreMutate({ chatPreferencesTab: undefined });
    } else if (chatPreferencesTab !== undefined) {
      setTab(chatPreferencesTab < tabs.length ? chatPreferencesTab : 0);
      appStoreMutate({ chatPreferencesTab: undefined });
    }
  }, [openChatPreferences, tabs.length]);

  const selectedTabId: PreferenceTabId = tabs[tab]?.id ?? "userInstructions";

  return (
    <Drawer
      handleOnly
      open={openChatPreferences}
      direction="top"
      onOpenChange={(open) => appStoreMutate({ openChatPreferences: open })}
    >
      <DrawerContent
        data-chat-preferences-drawer
        style={{ userSelect: "text" }}
        className="max-h-[100vh]! w-full h-full border-none rounded-none flex flex-col bg-card overflow-hidden p-4 md:p-6"
      >
        <div className="flex items-center justify-end">
          <DrawerClose asChild>
            <Button variant="ghost" size="icon">
              <X />
            </Button>
          </DrawerClose>
        </div>
        <DrawerTitle className="sr-only">Chat Preferences</DrawerTitle>
        <DrawerDescription className="sr-only" />

        <div className="flex justify-center">
          <div className="w-full mt-4 lg:w-5xl lg:mt-14">
            {/* Mobile: Tabs as horizontal scroll with arrows */}
            <MobileTabScroller tabs={tabs} tab={tab} setTab={setTab} />

            <div className="flex flex-1 overflow-hidden">
              {/* Desktop: Sidebar */}
              <div className="hidden md:block w-64">
                <nav className="px-4 flex flex-col gap-2">
                  {tabs.map((tabItem, index) => (
                    <DesktopPreferenceTab
                      key={tabItem.id}
                      active={tab === index}
                      icon={tabItem.icon}
                      label={tabItem.label}
                      onSelect={() => setTab(index)}
                    />
                  ))}
                </nav>
              </div>

              {/* Content */}
              <AutoHeight className="flex-1 rounded-lg border max-h-[80vh] overflow-y-auto">
                <div className="p-4 md:p-8">
                  {openChatPreferences && (
                    <>
                      {selectedTabId === "userInstructions" && (
                        <UserInstructionsContent />
                      )}
                      {selectedTabId === "mcpInstructions" && (
                        <MCPInstructionsContent />
                      )}
                      {selectedTabId === "exports" && (
                        <ExportsManagementContent />
                      )}
                      {selectedTabId === "modelCatalog" && (
                        <CustomModelsContent />
                      )}
                      {selectedTabId === "modelLabels" && (
                        <ModelLabelsContent />
                      )}
                      {selectedTabId === "backgroundEffects" && (
                        <BackgroundEffectsContent />
                      )}
                    </>
                  )}
                </div>
              </AutoHeight>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DesktopPreferenceTab({
  active,
  icon,
  label,
  onSelect,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  const surfaceColor = active ? "bg-primary" : "bg-muted";
  const surfaceOpacity = active
    ? "opacity-100"
    : "opacity-0 group-hover:opacity-50";

  return (
    <div className="group relative w-full">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 ${surfaceOpacity}`}
      >
        <span className={`absolute inset-0 rounded-lg ${surfaceColor}`} />
        <span className={`absolute inset-y-0 left-3 right-3 ${surfaceColor}`} />
      </div>
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={onSelect}
        className={`relative flex w-full appearance-none items-center gap-3 border-0 bg-transparent px-4 py-3 text-left ${
          active
            ? "text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </button>
    </div>
  );
}

function MobileTabScroller({
  tabs,
  tab,
  setTab,
}: {
  tabs: { label: string; icon: React.ReactNode }[];
  tab: number;
  setTab: (i: number) => void;
}) {
  const touchStartRef = useRef<number | null>(null);
  const previousTabRef = useRef(tab);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [transitioningFrom, setTransitioningFrom] = useState<number | null>(
    null,
  );

  const goNext = useCallback(() => {
    if (tab < tabs.length - 1) setTab(tab + 1);
  }, [tab, tabs.length, setTab]);

  const goPrev = useCallback(() => {
    if (tab > 0) setTab(tab - 1);
  }, [tab, setTab]);

  // Handle touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    const threshold = 50;
    if (diff > threshold) goNext();
    else if (diff < -threshold) goPrev();
    touchStartRef.current = null;
  };

  const canGoPrev = tab > 0;
  const canGoNext = tab < tabs.length - 1;

  // Keep the previously centered card mounted during the crossfade. The ref
  // fallback prevents a one-frame flash before the effect records it.
  const outgoingTab =
    previousTabRef.current !== tab ? previousTabRef.current : transitioningFrom;

  useEffect(() => {
    const previousTab = previousTabRef.current;
    if (previousTab === tab) return;

    previousTabRef.current = tab;
    setTransitioningFrom(previousTab);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = setTimeout(() => {
      setTransitioningFrom(null);
      transitionTimeoutRef.current = null;
    }, MOBILE_TAB_TRANSITION_MS);
  }, [tab]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="md:hidden flex items-center gap-2 pb-3">
      <button
        onClick={goPrev}
        disabled={!canGoPrev}
        className={`shrink-0 size-9 flex items-center justify-center rounded-full transition-all ${
          canGoPrev
            ? "text-muted-foreground hover:text-foreground hover:bg-muted"
            : "text-muted-foreground/20 cursor-default"
        }`}
        aria-label="Previous tab"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative h-10 min-w-0 flex-1 overflow-hidden"
      >
        {tabs.map((tabItem, index) => {
          const isActive = tab === index;
          const isVisible = isActive || outgoingTab === index;

          return (
            <div
              key={index}
              onClick={() => setTab(index)}
              aria-hidden={!isVisible}
              className={`absolute inset-x-0 top-0 mx-auto flex h-10 min-w-0 items-center justify-center gap-2.5 rounded-xl px-4 font-medium ${
                isVisible ? "visible" : "invisible"
              } ${
                isActive
                  ? "bg-primary text-primary-foreground cursor-pointer"
                  : "pointer-events-none bg-muted/50 text-muted-foreground"
              }`}
              style={{
                width: "min(200px, 100%)",
                transform: `scale(${isActive ? 1 : 0.96})`,
                opacity: isActive ? 1 : 0,
                transition: `transform ${MOBILE_TAB_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${MOBILE_TAB_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), background-color ${MOBILE_TAB_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
              }}
            >
              {tabItem.icon}
              <span className="truncate text-sm whitespace-nowrap">
                {tabItem.label}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={goNext}
        disabled={!canGoNext}
        className={`shrink-0 size-9 flex items-center justify-center rounded-full transition-all ${
          canGoNext
            ? "text-muted-foreground hover:text-foreground hover:bg-muted"
            : "text-muted-foreground/20 cursor-default"
        }`}
        aria-label="Next tab"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
