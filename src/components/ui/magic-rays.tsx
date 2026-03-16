"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

interface MagicRaysProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
  count?: number;
  color?: string;
  blur?: number;
  speed?: number;
  length?: string;
}

type MagicRay = {
  id: string;
  left: number;
  rotate: number;
  width: number;
  swing: number;
  delay: number;
  duration: number;
  intensity: number;
};

const createRays = (count: number, cycle: number): MagicRay[] => {
  if (count <= 0) return [];

  return Array.from({ length: count }, (_, index) => {
    const left = 8 + Math.random() * 84;
    const rotate = -28 + Math.random() * 56;
    const width = 160 + Math.random() * 160;
    const swing = 0.8 + Math.random() * 1.8;
    const delay = Math.random() * cycle;
    const duration = cycle * (0.75 + Math.random() * 0.5);
    const intensity = 0.6 + Math.random() * 0.5;

    return {
      id: `${index}-${Math.round(left * 10)}`,
      left,
      rotate,
      width,
      swing,
      delay,
      duration,
      intensity,
    };
  });
};

const Ray = ({
  left,
  rotate,
  width,
  swing,
  delay,
  duration,
  intensity,
}: MagicRay) => {
  return (
    <motion.div
      className="pointer-events-none absolute -top-[12%] left-[var(--ray-left)] h-[var(--magic-rays-length)] w-[var(--ray-width)] origin-top -translate-x-1/2 rounded-full bg-linear-to-b from-[color-mix(in_srgb,var(--magic-rays-color)_70%,transparent)] to-transparent opacity-0 mix-blend-screen blur-[var(--magic-rays-blur)]"
      style={
        {
          "--ray-left": `${left}%`,
          "--ray-width": `${width}px`,
        } as CSSProperties
      }
      initial={{ rotate: rotate }}
      animate={{
        opacity: [0, intensity, 0],
        rotate: [rotate - swing, rotate + swing, rotate - swing],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
        repeatDelay: duration * 0.1,
      }}
    />
  );
};

export function MagicRays({
  className,
  style,
  count = 7,
  color = "rgba(160, 210, 255, 0.2)",
  blur = 36,
  speed = 14,
  length = "70vh",
  ref,
  ...props
}: MagicRaysProps) {
  const [rays, setRays] = useState<MagicRay[]>([]);
  const cycleDuration = Math.max(speed, 0.1);

  useEffect(() => {
    setRays(createRays(count, cycleDuration));
  }, [count, cycleDuration]);

  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-none absolute inset-0 isolate overflow-hidden rounded-[inherit]",
        className,
      )}
      style={
        {
          "--magic-rays-color": color,
          "--magic-rays-blur": `${blur}px`,
          "--magic-rays-length": length,
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={
            {
              background:
                "radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--magic-rays-color) 45%, transparent), transparent 70%)",
            } as CSSProperties
          }
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={
            {
              background:
                "radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--magic-rays-color) 35%, transparent), transparent 75%)",
            } as CSSProperties
          }
        />
        {rays.map((ray) => (
          <Ray key={ray.id} {...ray} />
        ))}
      </div>
    </div>
  );
}

export default MagicRays;
