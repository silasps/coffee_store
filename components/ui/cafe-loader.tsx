"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CAFE_ITEMS = [
  { emoji: "☕", steam: true },
  { emoji: "🧁", steam: false },
  { emoji: "🥐", steam: false },
  { emoji: "🍰", steam: false },
  { emoji: "🫗", steam: true },
  { emoji: "🥨", steam: false },
  { emoji: "🍩", steam: false },
  { emoji: "🫖", steam: true },
];

const steams = [
  { x: -8, delay: 0 },
  { x: 0, delay: 0.25 },
  { x: 8, delay: 0.5 },
];

function SteamPuff({ x, delay }: { x: number; delay: number }) {
  return (
    <motion.div
      className="absolute bottom-full left-1/2 w-1.5 rounded-full"
      style={{ marginLeft: x, background: "rgba(255,255,255,0.75)", height: 20 }}
      initial={{ opacity: 0, y: 0, scaleX: 1 }}
      animate={{ opacity: [0, 0.8, 0], y: [-4, -28], scaleX: [1, 1.6] }}
      transition={{ duration: 1.4, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

function CafeIcon() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % CAFE_ITEMS.length);
    }, 500);
    return () => clearInterval(id);
  }, []);

  const item = CAFE_ITEMS[index];

  return (
    <div className="relative flex items-end justify-center" style={{ height: 100, width: 100 }}>
      {item.steam && steams.map((s) => <SteamPuff key={s.x} x={s.x} delay={s.delay} />)}
      <AnimatePresence>
        <motion.span
          key={index}
          className="text-7xl select-none absolute"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {item.emoji}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function CafeLoaderOverlay({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cafe-loader"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3"
          style={{ backdropFilter: "blur(8px)", background: "rgba(0,0,0,0.28)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <CafeIcon />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
