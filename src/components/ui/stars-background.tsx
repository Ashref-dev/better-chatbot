"use client";

import * as React from "react";
import {
  motion,
  type HTMLMotionProps,
  type SpringOptions,
  type Transition,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { cn } from "@/lib/utils";

type StarLayerProps = HTMLMotionProps<"div"> & {
  count: number;
  size: number;
  transition: Transition;
  starColor: string;
};

function generateStars(count: number, starColor: string) {
  const shadows: string[] = [];

  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;
    shadows.push(`${x}px ${y}px ${starColor}`);
  }

  return shadows.join(", ");
}

function StarLayer({
  count = 1000,
  size = 1,
  transition = { repeat: Infinity, duration: 50, ease: "linear" },
  starColor = "currentColor",
  className,
  ...props
}: StarLayerProps) {
  const [boxShadow, setBoxShadow] = React.useState("");

  React.useEffect(() => {
    setBoxShadow(generateStars(count, starColor));
  }, [count, starColor]);

  return (
    <motion.div
      data-slot="star-layer"
      animate={{ y: [0, -2000] }}
      transition={transition}
      className={cn("absolute top-0 left-0 h-[2000px] w-full", className)}
      {...props}
    >
      <div
        className="absolute rounded-full bg-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow,
        }}
      />
      <div
        className="absolute top-[2000px] rounded-full bg-transparent"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          boxShadow,
        }}
      />
    </motion.div>
  );
}

type StarsBackgroundProps = React.ComponentProps<"div"> & {
  factor?: number;
  speed?: number;
  transition?: SpringOptions;
  starColor?: string;
  performance?: boolean;
};

export function StarsBackground({
  children,
  className,
  factor = 0.05,
  speed = 50,
  transition = { stiffness: 50, damping: 20 },
  starColor = "currentColor",
  performance = false,
  style,
  ...props
}: StarsBackgroundProps) {
  const offsetX = useMotionValue(1);
  const offsetY = useMotionValue(1);
  const springX = useSpring(offsetX, transition);
  const springY = useSpring(offsetY, transition);
  const orientationBaseline = React.useRef<{
    beta: number;
    gamma: number;
  } | null>(null);

  const getMaxParallax = React.useCallback(() => {
    return Math.min(window.innerWidth * factor * 0.5, 24);
  }, [factor]);

  const updateParallax = React.useCallback(
    (clientX: number, clientY: number) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const maxOffset = getMaxParallax();
      offsetX.set(
        Math.max(
          -maxOffset,
          Math.min(maxOffset, -(clientX - centerX) * factor),
        ),
      );
      offsetY.set(
        Math.max(
          -maxOffset,
          Math.min(maxOffset, -(clientY - centerY) * factor),
        ),
      );
    },
    [factor, getMaxParallax, offsetX, offsetY],
  );

  const handleMouseMove = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      updateParallax(event.clientX, event.clientY);
    },
    [updateParallax],
  );

  const handleDeviceOrientation = React.useCallback(
    (event: DeviceOrientationEvent) => {
      if (event.beta == null || event.gamma == null) return;

      if (!orientationBaseline.current) {
        orientationBaseline.current = {
          beta: event.beta,
          gamma: event.gamma,
        };
        return;
      }

      const maxOffset = getMaxParallax();
      const deltaX = Math.max(
        -30,
        Math.min(30, event.gamma - orientationBaseline.current.gamma),
      );
      const deltaY = Math.max(
        -30,
        Math.min(30, event.beta - orientationBaseline.current.beta),
      );
      offsetX.set(-(deltaX / 30) * maxOffset);
      offsetY.set(-(deltaY / 30) * maxOffset);
    },
    [getMaxParallax, offsetX, offsetY],
  );

  React.useEffect(() => {
    const handleWindowMouseMove = (event: MouseEvent) => {
      updateParallax(event.clientX, event.clientY);
    };

    window.addEventListener("mousemove", handleWindowMouseMove, {
      passive: true,
    });
    window.addEventListener("deviceorientation", handleDeviceOrientation, {
      passive: true,
    });
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [handleDeviceOrientation, updateParallax]);

  const counts = performance ? [400, 150, 60] : [1000, 400, 200];

  return (
    <div
      data-slot="stars-background"
      className={cn(
        "relative size-full overflow-hidden text-foreground",
        className,
      )}
      style={{
        background: "var(--background)",
        ...style,
      }}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 origin-bottom"
        animate={{ opacity: [0.72, 0.9, 0.72], scale: [1, 1.015, 1] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background:
            "radial-gradient(ellipse 90% 58% at 50% 100%, color-mix(in srgb, var(--foreground) 13%, var(--background)) 0%, color-mix(in srgb, var(--foreground) 6%, var(--background)) 38%, transparent 82%)",
        }}
      />
      <motion.div style={{ x: springX, y: springY }}>
        <StarLayer
          count={counts[0]}
          size={1}
          transition={{ repeat: Infinity, duration: speed, ease: "linear" }}
          starColor={starColor}
        />
        <StarLayer
          count={counts[1]}
          size={2}
          transition={{
            repeat: Infinity,
            duration: speed * 2,
            ease: "linear",
          }}
          starColor={starColor}
        />
        <StarLayer
          count={counts[2]}
          size={3}
          transition={{
            repeat: Infinity,
            duration: speed * 3,
            ease: "linear",
          }}
          starColor={starColor}
        />
      </motion.div>
      {children}
    </div>
  );
}
