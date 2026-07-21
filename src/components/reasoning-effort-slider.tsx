"use client";

import type { ChatModel, ReasoningEffort } from "app-types/chat";
import {
  REASONING_EFFORT_LABELS,
  getValidatedReasoningEffort,
  getReasoningEffortSupport,
} from "lib/ai/reasoning-effort";
import { cn } from "lib/utils";
import { DropdownMenuLabel } from "./ui/dropdown-menu";

interface ReasoningEffortSliderProps {
  model?: ChatModel;
  value?: ReasoningEffort;
  onValueChange: (value: ReasoningEffort | undefined) => void;
}

export function ReasoningEffortSlider({
  model,
  value,
  onValueChange,
}: ReasoningEffortSliderProps) {
  const support = getReasoningEffortSupport(model);

  if (!support) {
    return (
      <>
        <DropdownMenuLabel className="text-muted-foreground">
          Reasoning effort
        </DropdownMenuLabel>
        <p className="px-2 pb-2 text-xs text-muted-foreground">
          This model does not expose reasoning controls.
        </p>
      </>
    );
  }

  const options: readonly (ReasoningEffort | undefined)[] = [
    undefined,
    ...support.efforts,
  ];
  const effectiveValue = getValidatedReasoningEffort(model, value);
  const selectedIndex = Math.max(0, options.indexOf(effectiveValue));
  const selectedEffort = options[selectedIndex];
  const selectedLabel = selectedEffort
    ? REASONING_EFFORT_LABELS[selectedEffort]
    : "Default";
  const progress = (selectedIndex / (options.length - 1)) * 100;

  return (
    <>
      <DropdownMenuLabel className="text-muted-foreground">
        <span>Reasoning effort</span>
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          {selectedLabel}
        </span>
      </DropdownMenuLabel>

      <div className="relative mx-2 mt-1 h-5 min-w-0">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
          {options.map((option, index) => (
            <span
              key={option ?? "default"}
              className={cn(
                "size-2 rounded-full border border-background transition-colors",
                index <= selectedIndex
                  ? "bg-primary"
                  : "bg-muted-foreground/50",
              )}
            />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={options.length - 1}
          step={1}
          value={selectedIndex}
          onChange={(event) =>
            onValueChange(options[Number(event.target.value)])
          }
          onKeyDown={(event) => event.stopPropagation()}
          aria-label="Reasoning effort"
          aria-valuetext={selectedLabel}
          className="absolute inset-0 h-5 min-w-0 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:bg-primary [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:mt-[-4px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:bg-primary"
        />
      </div>

      <div className="mx-2 mt-1 flex justify-between pb-2 text-[10px] text-muted-foreground">
        <span>Default</span>
        <span>{REASONING_EFFORT_LABELS[support.efforts.at(-1)!]}</span>
      </div>
    </>
  );
}
