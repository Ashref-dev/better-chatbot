"use client";

import { appStore } from "@/app/store";
import { useModelLabelOverrides } from "@/hooks/use-model-label-overrides";
import { useChatModels } from "@/hooks/queries/use-chat-models";
import { ChatModel } from "app-types/chat";
import { resolveModelDisplay } from "lib/ai/model-labels";
import { cn } from "lib/utils";
import { CheckIcon, ChevronDown, Settings } from "lucide-react";
import {
  Fragment,
  memo,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "ui/command";
import { ModelProviderIcon } from "ui/model-provider-icon";
import { Popover, PopoverContent, PopoverTrigger } from "ui/popover";
import { ManageOpenRouterModelsDialog } from "./manage-openrouter-models-dialog";

interface SelectModelProps {
  onSelect: (model: ChatModel) => void;
  align?: "start" | "end";
  currentModel?: ChatModel;
  showProvider?: boolean;
}

export const SelectModel = (props: PropsWithChildren<SelectModelProps>) => {
  const [open, setOpen] = useState(false);
  const [openRouterDialogOpen, setOpenRouterDialogOpen] = useState(false);
  const { data: providers } = useChatModels();
  const modelLabelOverrides = useModelLabelOverrides();
  const [model, setModel] = useState(props.currentModel);

  const selectedDisplay = useMemo(() => {
    return resolveModelDisplay(
      model?.provider,
      model?.model,
      modelLabelOverrides,
    );
  }, [model?.provider, model?.model, modelLabelOverrides]);

  useEffect(() => {
    const modelToUse = props.currentModel ?? appStore.getState().chatModel;

    if (modelToUse) {
      setModel(modelToUse);
    }
  }, [props.currentModel]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {props.children || (
            <Button
              variant={"secondary"}
              size={"sm"}
              className="data-[state=open]:bg-input! hover:bg-input! "
              data-testid="model-selector-button"
            >
              <div className="mr-auto flex items-center gap-[0.1rem]">
                {(props.showProvider ?? true) && (
                  <ModelProviderIcon
                    provider={model?.provider || ""}
                    className="size-2.5 mr-1"
                  />
                )}
                <p data-testid="selected-model-name">{selectedDisplay.label}</p>
                {selectedDisplay.badge && (
                  <span className="text-[8px] px-1 py-px rounded-sm bg-muted/40 text-muted-foreground/70 font-medium leading-none uppercase tracking-wider">
                    {selectedDisplay.badge}
                  </span>
                )}
              </div>
              <ChevronDown className="size-3" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[280px]"
          align={props.align || "end"}
          data-testid="model-selector-popover"
        >
          <Command
            className="rounded-lg relative shadow-md h-80"
            value={JSON.stringify(model)}
            onClick={(e) => e.stopPropagation()}
          >
            <CommandInput
              placeholder="search model..."
              data-testid="model-search-input"
            />
            <CommandList className="p-2">
              <CommandEmpty>No results found.</CommandEmpty>
              {providers?.map((provider, i) => (
                <Fragment key={provider.provider}>
                  <CommandGroup
                    heading={
                      <ProviderHeader
                        provider={provider.provider}
                        hasAPIKey={provider.hasAPIKey}
                        onManageModels={
                          provider.provider === "openRouter"
                            ? () => {
                                setOpen(false);
                                setOpenRouterDialogOpen(true);
                              }
                            : undefined
                        }
                      />
                    }
                    className={cn(
                      "pb-4 group",
                      !provider.hasAPIKey && "opacity-50",
                    )}
                    onWheel={(e) => {
                      e.stopPropagation();
                    }}
                    data-testid={`model-provider-${provider.provider}`}
                  >
                    {provider.models.map((item) =>
                      (() => {
                        const itemDisplay = resolveModelDisplay(
                          provider.provider,
                          item.name,
                          modelLabelOverrides,
                        );

                        return (
                          <CommandItem
                            key={item.name}
                            disabled={!provider.hasAPIKey}
                            className="cursor-pointer"
                            onSelect={() => {
                              setModel({
                                provider: provider.provider,
                                model: item.name,
                              });
                              props.onSelect({
                                provider: provider.provider,
                                model: item.name,
                              });
                              setOpen(false);
                            }}
                            value={`${item.name} ${itemDisplay.label} ${itemDisplay.badge || ""}`}
                            data-testid={`model-option-${provider.provider}-${item.name}`}
                          >
                            {model?.provider === provider.provider &&
                            model?.model === item.name ? (
                              <CheckIcon
                                className="size-3"
                                data-testid="selected-model-check"
                              />
                            ) : (
                              <div className="ml-3" />
                            )}

                            <div className="pr-2 min-w-0 flex flex-col">
                              <div className="flex items-center gap-[0.1rem] min-w-0">
                                <span className="truncate">
                                  {itemDisplay.label}
                                </span>
                                {itemDisplay.badge && (
                                  <span className="text-[8px] px-1 py-px rounded-sm bg-muted/40 text-muted-foreground/70 font-medium leading-none uppercase tracking-wider shrink-0">
                                    {itemDisplay.badge}
                                  </span>
                                )}
                              </div>
                              {itemDisplay.label !== item.name && (
                                <span className="text-[10px] text-muted-foreground truncate">
                                  {item.name}
                                </span>
                              )}
                            </div>

                            {item.isToolCallUnsupported && (
                              <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                                No tools
                              </div>
                            )}
                          </CommandItem>
                        );
                      })(),
                    )}
                  </CommandGroup>
                  {i < providers?.length - 1 && <CommandSeparator />}
                </Fragment>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <ManageOpenRouterModelsDialog
        open={openRouterDialogOpen}
        onOpenChange={setOpenRouterDialogOpen}
      />
    </>
  );
};

const ProviderHeader = memo(function ProviderHeader({
  provider,
  hasAPIKey,
  onManageModels,
}: {
  provider: string;
  hasAPIKey: boolean;
  onManageModels?: () => void;
}) {
  return (
    <div className="text-sm text-muted-foreground flex items-center gap-1.5 group-hover:text-foreground transition-colors duration-300">
      {provider === "openai" ? (
        <ModelProviderIcon
          provider="openai"
          className="size-3 text-foreground"
        />
      ) : (
        <ModelProviderIcon provider={provider} className="size-3" />
      )}
      {provider}
      {provider === "openRouter" && onManageModels && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onManageModels();
          }}
          className="ml-auto p-1 hover:bg-accent rounded transition-colors"
          title="Manage custom models"
          type="button"
        >
          <Settings className="size-3" />
        </button>
      )}
      {!hasAPIKey && (
        <>
          <span className="text-xs ml-auto text-muted-foreground">
            No API Key
          </span>
        </>
      )}
    </div>
  );
});
