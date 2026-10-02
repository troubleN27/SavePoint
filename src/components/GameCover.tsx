"use client";

import { useState } from "react";
import { Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-cyan/40 via-violet/30 to-bg",
  "from-magenta/40 via-violet/30 to-bg",
  "from-lime/30 via-cyan/25 to-bg",
  "from-violet/45 via-magenta/25 to-bg",
  "from-red/35 via-magenta/25 to-bg",
];

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/** Обложка игры с неоновой заглушкой, если картинки нет или она не загрузилась. */
export function GameCover({ src, title, className }: { src: string | null; title: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <div className={cn("relative aspect-[3/4] overflow-hidden bg-surface-2", className)}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={title}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className={cn("absolute inset-0 flex flex-col justify-between bg-gradient-to-br p-3", GRADIENTS[hash(title) % GRADIENTS.length])}>
          <div className="bg-grid absolute inset-0 opacity-60" />
          <Gamepad2 className="relative size-6 text-ink/60" />
          <span className="relative font-display text-sm font-bold leading-tight text-ink line-clamp-4 [text-shadow:0_0_14px_rgba(34,211,238,0.6)]">
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
