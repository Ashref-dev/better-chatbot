"use client";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { useTheme } from "next-themes";
import { Fragment, useLayoutEffect, useState } from "react";
import type { JSX, ReactNode } from "react";
import { codeToHast } from "shiki/bundle/web";
import { safe } from "ts-safe";
import { jsx, jsxs } from "react/jsx-runtime";
import { cn } from "lib/utils";
import { getCodeTheme } from "lib/code-theme";

export function CodeBlock({
  code,
  lang,
  fallback,
  className,
  showLineNumbers = true,
}: {
  code?: string;
  lang: string;
  fallback?: ReactNode;
  className?: string;
  showLineNumbers?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  const codeTheme = getCodeTheme(resolvedTheme);

  const [component, setComponent] = useState<JSX.Element | null>(null);

  useLayoutEffect(() => {
    safe()
      .map(async () => {
        const out = await codeToHast(code || "", {
          lang: lang,
          theme: codeTheme,
        });
        return toJsxRuntime(out, {
          Fragment,
          jsx,
          jsxs,
          components: {
            pre: (props) => {
              const { style, ...preProps } = props;

              return (
                <pre
                  {...preProps}
                  style={{ ...style, backgroundColor: "transparent" }}
                  lang={lang}
                  className={cn(
                    "min-w-0 overflow-x-auto bg-secondary/40 font-mono text-[0.85rem] leading-6",
                    props.className,
                    className,
                  )}
                >
                  <div className={cn(showLineNumbers && "pl-12 relative")}>
                    {showLineNumbers && (
                      <div className="absolute left-0 top-0 w-6 flex flex-col select-none text-right text-muted-foreground">
                        {code?.split("\n").map((_, index) => (
                          <span key={index}>{index + 1}</span>
                        ))}
                      </div>
                    )}
                    {props.children}
                  </div>
                </pre>
              );
            },
          },
        }) as JSX.Element;
      })
      .ifOk(setComponent);
  }, [codeTheme, lang, code]);

  if (!code) return fallback;

  return component ?? fallback;
}
