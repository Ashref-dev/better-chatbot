"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronRight, X } from "lucide-react";
import { cn } from "lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuItem,
} from "ui/dropdown-menu";
import { Button } from "ui/button";

// Context to track if we're inside a mobile submenu panel
const MobileSubmenuPanelContext = React.createContext(false);

// Hook to check if inside mobile panel
export function useInMobileSubmenuPanel() {
  return React.useContext(MobileSubmenuPanelContext);
}

// Context to manage which mobile submenu is open (only one at a time)
interface MobileSubmenuContextValue {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  requestCloseParent?: () => void;
}

const MobileSubmenuContext =
  React.createContext<MobileSubmenuContextValue | null>(null);

/**
 * Provider that ensures only one mobile submenu can be open at a time.
 */
export function MobileSubmenuProvider({
  children,
  requestCloseParent,
  onOpenSubmenuChange,
}: {
  children: React.ReactNode;
  requestCloseParent?: () => void;
  onOpenSubmenuChange?: (open: boolean) => void;
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  React.useEffect(() => {
    onOpenSubmenuChange?.(openId !== null);
  }, [openId, onOpenSubmenuChange]);

  return (
    <MobileSubmenuContext.Provider
      value={{ openId, setOpenId, requestCloseParent }}
    >
      {children}
    </MobileSubmenuContext.Provider>
  );
}

/**
 * A menu item that works both in desktop dropdowns and mobile panels.
 * In mobile panels, renders as a plain button instead of DropdownMenuItem.
 */
export function MobileCompatibleMenuItem({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}) {
  const inMobilePanel = React.useContext(MobileSubmenuPanelContext);

  if (!inMobilePanel) {
    return (
      <DropdownMenuItem
        disabled={disabled}
        onClick={onClick}
        className={className}
      >
        {children}
      </DropdownMenuItem>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none",
        "hover:bg-accent hover:text-accent-foreground",
        "focus:bg-accent focus:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );
}

interface MobileAwareSubmenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  triggerClassName?: string;
  contentClassName?: string;
  title?: string;
  icon?: React.ReactNode;
  onTriggerClick?: (e: React.MouseEvent) => void;
}

let submenuIdCounter = 0;

/**
 * A submenu component that:
 * - On desktop: renders as a side-opening Radix submenu
 * - On mobile: opens a centered overlay panel via portal (only one at a time)
 */
export function MobileAwareSubmenu({
  trigger,
  children,
  triggerClassName,
  contentClassName,
  title,
  icon,
  onTriggerClick,
}: MobileAwareSubmenuProps) {
  const isMobile = useIsMobile();
  const [mounted, setMounted] = React.useState(false);
  const idRef = React.useRef<string>("");
  const ctx = React.useContext(MobileSubmenuContext);

  // Generate stable ID on mount
  React.useEffect(() => {
    if (!idRef.current) {
      idRef.current = `submenu-${++submenuIdCounter}`;
    }
    setMounted(true);
  }, []);

  const isOpen = ctx?.openId === idRef.current;

  const handleOpen = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (onTriggerClick) {
        onTriggerClick(e);
      }
      ctx?.setOpenId(idRef.current);
    },
    [ctx, onTriggerClick],
  );

  const handleClose = React.useCallback(() => {
    ctx?.setOpenId(null);
  }, [ctx]);

  // Mobile: overlay panel via portal
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors",
            triggerClassName,
          )}
        >
          {trigger}
          <div className="ml-auto flex items-center gap-1">
            {icon}
            <ChevronRight className="size-4 text-muted-foreground" />
          </div>
        </button>

        {/* Mobile overlay panel - rendered via portal */}
        {mounted &&
          isOpen &&
          createPortal(
            <MobileSubmenuPanelContext.Provider value={true}>
              <MobileSubmenuPanel
                title={title}
                contentClassName={contentClassName}
                onClose={handleClose}
                onCloseAll={ctx?.requestCloseParent}
              >
                {children}
              </MobileSubmenuPanel>
            </MobileSubmenuPanelContext.Provider>,
            document.body,
          )}
      </>
    );
  }

  // Desktop: standard Radix submenu
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className={triggerClassName}
        icon={icon ?? <ChevronRight className="ml-auto size-4" />}
        onClick={onTriggerClick}
      >
        {trigger}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className={contentClassName}>
          {children}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}

/**
 * The actual panel component
 */
function MobileSubmenuPanel({
  title,
  contentClassName,
  onClose,
  onCloseAll,
  children,
}: {
  title?: string;
  contentClassName?: string;
  onClose: () => void;
  onCloseAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div data-mobile-submenu-overlay="true" className="fixed inset-0 z-[9999]">
      {/* Backdrop - tap to close */}
      <div
        data-mobile-submenu-backdrop="true"
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          onClose();
          onCloseAll?.();
        }}
      />

      {/* Panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div
          data-mobile-submenu-panel="true"
          className={cn(
            "pointer-events-auto w-full max-w-sm bg-popover border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-150",
            contentClassName,
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <span className="font-semibold text-sm">{title || "Options"}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 -mr-1"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
