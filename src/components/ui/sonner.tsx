"use client";

import { useTheme } from "next-themes";
import { useMemo } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  const themeBase = useMemo(() => {
    return theme == "dark" ? "dark" : "default";
  }, [theme]);
  return (
    <Sonner
      theme={themeBase as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-background/95 backdrop-blur-md border border-border shadow-lg",
          title: "text-foreground font-medium",
          description: "text-muted-foreground",
          success: "bg-background/95 border-green-500/30",
          error: "bg-background/95 border-destructive/30",
          warning: "bg-background/95 border-yellow-500/30",
          info: "bg-background/95 border-blue-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
