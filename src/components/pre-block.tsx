"use client";

import type { JSX } from "react";
import {
  bundledLanguages,
  codeToHast,
  type BundledLanguage,
  type BundledTheme,
} from "shiki/bundle/web";
import { Fragment, useLayoutEffect, useState } from "react";
import type { ComponentProps } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { safe } from "ts-safe";
import { cn } from "lib/utils";
import { useTheme } from "next-themes";
import { Button } from "ui/button";
import { CheckIcon, CopyIcon } from "lucide-react";
import JsonView from "ui/json-view";
import { useCopy } from "@/hooks/use-copy";
import dynamic from "next/dynamic";
import { getCodeTheme } from "lib/code-theme";

// Dynamically import MermaidDiagram component
const MermaidDiagram = dynamic(
  () => import("./mermaid-diagram").then((mod) => mod.MermaidDiagram),
  {
    loading: () => (
      <div className="text-sm flex bg-accent/30 flex-col rounded-2xl relative my-4 overflow-hidden border">
        <div className="w-full flex z-20 py-2 px-4 items-center">
          <span className="text-sm text-muted-foreground">mermaid</span>
        </div>
        <div className="relative overflow-x-auto px-6 pb-6">
          <div className="h-20 w-full flex items-center justify-center">
            <span className="text-muted-foreground">
              Loading Mermaid renderer...
            </span>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  },
);

const PurePre = ({
  children,
  className,
  code,
  lang,
  ...props
}: {
  children: ComponentProps<"pre">["children"];
  className?: string;
  code: string;
  lang: string;
} & Omit<ComponentProps<"pre">, "children" | "className">) => {
  const { copied, copy } = useCopy();
  const { style, ...preProps } = props;

  return (
    <pre
      {...preProps}
      style={{ ...style, backgroundColor: "transparent" }}
      className={cn(
        "relative min-w-0 font-mono text-[0.85rem] leading-6",
        className,
      )}
    >
      <div className="p-1.5 border-b mb-4 z-20 bg-secondary">
        <div className="w-full flex z-20 py-0.5 px-4 items-center">
          <span className="text-sm text-muted-foreground">{lang}</span>
          <Button
            size="icon"
            variant={copied ? "secondary" : "ghost"}
            className="ml-auto z-10 p-3! size-2! rounded-sm"
            onClick={() => {
              copy(code);
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon className="size-3!" />}
          </Button>
        </div>
      </div>

      <div className="relative overflow-x-auto px-6 pb-6">{children}</div>
    </pre>
  );
};

export async function Highlight(
  code: string,
  lang: BundledLanguage | (string & {}),
  theme: BundledTheme,
) {
  const normalizedLanguage = lang.trim().toLowerCase();
  const parsed: BundledLanguage = (
    bundledLanguages[normalizedLanguage] ? normalizedLanguage : "md"
  ) as BundledLanguage;

  if (normalizedLanguage === "json") {
    return (
      <PurePre code={code} lang={lang}>
        <JsonView data={code} initialExpandDepth={3} />
      </PurePre>
    );
  }

  if (lang === "mermaid") {
    return (
      <PurePre code={code} lang={lang}>
        <MermaidDiagram chart={code} />
      </PurePre>
    );
  }

  const out = await codeToHast(code, {
    lang: parsed,
    theme,
  });

  return toJsxRuntime(out, {
    Fragment,
    jsx,
    jsxs,
    components: {
      pre: (props) => <PurePre {...props} code={code} lang={lang} />,
    },
  }) as JSX.Element;
}

export function PreBlock({ children }: { children: any }) {
  const code = children.props.children;
  const { resolvedTheme } = useTheme();
  const languageClass = children.props.className
    ?.split(/\s+/)
    .find((className: string) => /^language-/i.test(className));
  const language = languageClass?.replace(/^language-/i, "") || "bash";
  const codeTheme = getCodeTheme(resolvedTheme);
  const [loading, setLoading] = useState(true);
  const [component, setComponent] = useState<JSX.Element | null>(
    <PurePre className="animate-pulse" code={code} lang={language}>
      {children}
    </PurePre>,
  );

  useLayoutEffect(() => {
    safe()
      .map(() => Highlight(code, language, codeTheme))
      .ifOk(setComponent)
      .watch(() => setLoading(false));
  }, [codeTheme, language, code]);

  // For other code blocks, render as before
  return (
    <div
      className={cn(
        loading && "animate-pulse",
        "text-sm flex bg-secondary/40 shadow border flex-col rounded relative my-4 overflow-hidden",
      )}
    >
      {component}
    </div>
  );
}
