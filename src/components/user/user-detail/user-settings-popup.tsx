"use client";

import { appStore } from "@/app/store";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "ui/drawer";
import { useShallow } from "zustand/shallow";

export function UserSettingsPopup({
  userSettingsComponent,
}: {
  userSettingsComponent: React.ReactNode;
}) {
  const t = useTranslations("Chat.ChatPreferences");
  const [openUserSettings, appStoreMutate] = appStore(
    useShallow((state) => [state.openUserSettings, state.mutate]),
  );

  return (
    <Drawer
      handleOnly
      open={openUserSettings}
      direction="top"
      onOpenChange={(open) => appStoreMutate({ openUserSettings: open })}
    >
      <DrawerContent
        style={{
          userSelect: "text",
        }}
        className="max-h-[100vh]! w-full h-full  rounded-none flex flex-col overflow-hidden p-4 md:p-6"
      >
        <div className="flex items-center justify-end">
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              data-testid="close-user-settings-button"
            >
              <X />
            </Button>
          </DrawerClose>
        </div>
        <DrawerTitle className="sr-only">{t("userSettings")}</DrawerTitle>
        <DrawerDescription className="sr-only" />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">{userSettingsComponent}</div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
