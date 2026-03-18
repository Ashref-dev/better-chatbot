"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { AutoHeight } from "ui/auto-height";

import { appStore } from "@/app/store";
import { useShallow } from "zustand/shallow";
import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerPortal,
  DrawerTitle,
} from "ui/drawer";
import {
  MCPInstructionsContent,
  UserInstructionsContent,
  ExportsManagementContent,
} from "./chat-preferences-content";
import {
  UserIcon,
  X,
  Share2,
  Tags,
  Sparkles,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "ui/button";
import { useTranslations } from "next-intl";
import { MCPIcon } from "ui/mcp-icon";
import { ModelLabelsContent } from "./model-labels-content";
import { BackgroundEffectsContent } from "./background-effects-content";
import { CustomModelsContent } from "./custom-models-content";

export function ChatPreferencesPopup() {
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
        label: t("Chat.ChatPreferences.userInstructions"),
        icon: <UserIcon className="w-4 h-4" />,
      },
      {
        label: t("Chat.ChatPreferences.mcpInstructions"),
        icon: <MCPIcon className="w-4 h-4 fill-muted-foreground" />,
      },
      {
        label: t("Chat.ChatPreferences.myExports"),
        icon: <Share2 className="w-4 h-4" />,
      },
      {
        label: "Custom Models",
        icon: <Boxes className="w-4 h-4" />,
      },
      {
        label: "Model Labels",
        icon: <Tags className="w-4 h-4" />,
      },
      {
        label: "Background Effects",
        icon: <Sparkles className="w-4 h-4" />,
      },
    ];
  }, [t]);

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
      setTab(chatPreferencesTab);
      appStoreMutate({ chatPreferencesTab: undefined });
    }
  }, [openChatPreferences]);

  return (
    <Drawer
      handleOnly
      open={openChatPreferences}
      direction="top"
      onOpenChange={(open) => appStoreMutate({ openChatPreferences: open })}
    >
      <DrawerPortal>
        <DrawerContent
          style={{
            userSelect: "text",
          }}
          className="max-h-[100vh]! w-full h-full border-none rounded-none flex flex-col bg-card overflow-hidden p-4 md:p-6"
        >
          <div className="flex items-center justify-end">
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X />
            </Button>
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
                      <button
                        key={index}
                        onClick={() => setTab(index)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          tab === index
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tabItem.icon}
                        <span className="font-medium">{tabItem.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Content */}
                <AutoHeight className="flex-1 rounded-lg border max-h-[80vh] overflow-y-auto">
                  <div className="p-4 md:p-8">
                    {openChatPreferences && (
                      <>
                        {tab == 0 ? (
                          <UserInstructionsContent />
                        ) : tab == 1 ? (
                          <MCPInstructionsContent />
                        ) : tab == 2 ? (
                          <ExportsManagementContent />
                        ) : tab == 3 ? (
                          <CustomModelsContent />
                        ) : tab == 4 ? (
                          <ModelLabelsContent />
                        ) : tab == 5 ? (
                          <BackgroundEffectsContent />
                        ) : null}
                      </>
                    )}
                  </div>
                </AutoHeight>
              </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
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
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);

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
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="flex-1 overflow-hidden relative"
      >
        <div
          className="flex gap-4 px-4"
          style={{
            transform: `translateX(calc(50% - ${tab * 216 + 108}px))`,
            transition: "transform 300ms ease-out",
          }}
        >
          {tabs.map((tabItem, index) => (
            <div
              key={index}
              onClick={() => setTab(index)}
              className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl font-medium cursor-pointer shrink-0 ${
                tab === index
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:opacity-60"
              }`}
              style={{
                width: "200px",
                transform: tab === index ? "scale(1)" : "scale(0.9)",
                opacity: tab === index ? 1 : 0.4,
                transition:
                  "transform 300ms ease-out, opacity 300ms ease-out, background-color 300ms ease-out",
              }}
            >
              {tabItem.icon}
              <span className="text-sm whitespace-nowrap">{tabItem.label}</span>
            </div>
          ))}
        </div>
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
