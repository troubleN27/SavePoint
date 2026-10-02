import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-8 place-items-center rounded-lg border border-red/70 bg-red/10 shadow-[0_0_16px_rgba(255,40,0,0.45)] transition group-hover:shadow-[0_0_26px_rgba(255,40,0,0.75)]">
        <svg viewBox="0 0 24 24" className="size-4 text-red drop-shadow-[0_0_4px_rgba(255,40,0,0.8)]" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M5 4h11l3 3v13H5z" />
          <path d="M8 4v5h7V4M8 20v-6h8v6" />
        </svg>
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        Save<span className="text-neon-red">Point</span>
      </span>
    </Link>
  );
}
