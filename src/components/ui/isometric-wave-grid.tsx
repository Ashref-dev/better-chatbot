"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "next-themes";

interface IsometricWaveGridProps {
  color?: string;
  speed?: number;
  density?: number;
  className?: string;
}

const IsometricWaveGrid = ({
  speed = 1,
  density = 40,
  className,
}: IsometricWaveGridProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = container.offsetWidth;
    let height = container.offsetHeight;
    let animationFrameId: number;

    const gridGap = density;
    let rows = Math.ceil(height / gridGap) + 5;
    let cols = Math.ceil(width / gridGap) + 5;

    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    let time = 0;

    const rgb = theme === "dark" ? "200, 200, 220" : "40, 40, 60";

    const resize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      rows = Math.ceil(height / gridGap) + 5;
      cols = Math.ceil(width / gridGap) + 5;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
    };

    const handleMouseLeave = () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      mouse.x += (mouse.targetX - mouse.x) * 0.1;
      mouse.y += (mouse.targetY - mouse.y) * 0.1;
      time += 0.01 * speed;

      ctx.beginPath();

      for (let y = 0; y <= rows; y++) {
        let isFirst = true;
        for (let x = 0; x <= cols; x++) {
          const baseX = x * gridGap - gridGap * 2;
          const baseY = y * gridGap - gridGap * 2;

          const wave = Math.sin(x * 0.2 + time) * Math.cos(y * 0.2 + time) * 15;

          const dx = baseX - mouse.x;
          const dy = baseY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const force = Math.max(0, (300 - dist) / 300);
          const interactionY = -(force * force) * 80;

          const finalX = baseX;
          const finalY = baseY + wave + interactionY;

          if (isFirst) {
            ctx.moveTo(finalX, finalY);
            isFirst = false;
          } else {
            ctx.lineTo(finalX, finalY);
          }
        }
      }

      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `rgba(${rgb}, 0)`);
      gradient.addColorStop(0.5, `rgba(${rgb}, 0.35)`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, speed, density]);

  return (
    <div
      ref={containerRef}
      className={`w-full h-full overflow-hidden ${className ?? ""}`}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
};

export default IsometricWaveGrid;
