import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn, toAny } from "lib/utils";

const badgeVariants = cva(
  "inline-flex items-end justify-center rounded-sm border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-[0.1rem] [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/40 text-primary-foreground [a&]:hover:bg-primary/60",
        secondary:
          "border-transparent bg-secondary/40 text-secondary-foreground [a&]:hover:bg-secondary/60",
        destructive:
          "border-transparent bg-destructive/40 text-white [a&]:hover:bg-destructive/60 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/40",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const classNames = cn(badgeVariants({ variant }), className);

  if (asChild) {
    return <Slot data-slot="badge" className={classNames} {...toAny(props)} />;
  }

  return <span data-slot="badge" className={classNames} {...props} />;
}

export { Badge, badgeVariants };
