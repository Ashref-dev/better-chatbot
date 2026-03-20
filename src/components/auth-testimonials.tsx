"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "A. Ben Abdallah",
    handle: "@abenabdallah",
    text: "This completely changed how I work with AI. The interface is incredibly intuitive.",
    avatar: "A",
  },
  {
    name: "Rayen Fassatoui",
    handle: "@rfassatoui",
    text: "Best self-hosted chat solution I've found. Clean, fast, and fully customizable.",
    avatar: "R",
  },
];

export function AuthTestimonials() {
  return (
    <div className="flex gap-3">
      {testimonials.map((t, i) => (
        <motion.div
          key={t.handle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 + i * 0.2 }}
          className="flex items-start gap-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 flex-1"
        >
          <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white/70 shrink-0">
            {t.avatar}
          </div>
          <div className="text-sm leading-snug min-w-0">
            <p className="font-medium text-white/90">{t.name}</p>
            <p className="text-white/40 text-xs">{t.handle}</p>
            <p className="mt-1.5 text-white/60 text-xs leading-relaxed">
              {t.text}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
