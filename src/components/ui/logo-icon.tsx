"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";

export function LogoIcon({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Image
        src="/logo-dark.svg"
        alt="Logo"
        width={24}
        height={24}
        className={className}
      />
    );
  }

  return (
    <Image
      src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
      alt="Logo"
      width={24}
      height={24}
      className={className}
    />
  );
}
