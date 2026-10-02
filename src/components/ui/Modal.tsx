"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  children,
  className,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl p-0 text-ink backdrop:bg-black/70 backdrop:backdrop-blur-sm neon-border",
        "open:animate-slide-up",
        className,
      )}
    >
      {open && (
        <div className="relative p-6 sm:p-8">
          <button
            onClick={onClose}
            aria-label="Закрыть"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink cursor-pointer"
          >
            <X className="size-5" />
          </button>
          {children}
        </div>
      )}
    </dialog>
  );
}
