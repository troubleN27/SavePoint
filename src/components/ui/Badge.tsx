import { cn } from "@/lib/utils";
import { STATUS_META, type GameStatus } from "@/lib/constants";

const tones = {
  cyan: "border-cyan/40 bg-cyan/10 text-cyan",
  lime: "border-lime/40 bg-lime/10 text-lime",
  violet: "border-violet/40 bg-violet/10 text-violet",
  red: "border-red/40 bg-red/10 text-red",
  magenta: "border-magenta/40 bg-magenta/10 text-magenta",
  amber: "border-amber/40 bg-amber/10 text-amber",
  muted: "border-line bg-surface-2 text-muted",
} as const;

export type Tone = keyof typeof tones;

export function Badge({ tone = "muted", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = STATUS_META[status as GameStatus];
  if (!meta) return null;
  return (
    <Badge tone={meta.color as Tone} className={className}>
      {meta.label}
    </Badge>
  );
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider leading-none text-bg bg-gradient-to-r from-magenta to-violet shadow-[0_0_10px_rgba(232,121,249,0.5)]",
        className,
      )}
    >
      PRO
    </span>
  );
}

export function ratingTone(rating: number): Tone {
  if (rating >= 9) return "lime";
  if (rating >= 7) return "cyan";
  if (rating >= 5) return "amber";
  return "red";
}

export function RatingPill({ rating, className }: { rating: number; className?: string }) {
  const tone = ratingTone(rating);
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border font-display text-sm font-bold backdrop-blur",
        tones[tone],
        className,
      )}
      title={`Оценка ${rating}/10`}
    >
      {rating}
    </span>
  );
}
