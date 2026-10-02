import Link from "next/link";
import { Calendar, Clock, Monitor } from "lucide-react";
import { GameCover } from "./GameCover";
import { RatingPill, StatusBadge } from "./ui/Badge";
import { cn } from "@/lib/utils";

export type GameCardData = {
  title: string;
  coverUrl: string | null;
  genres: string[];
  platform: string | null;
  releaseYear: number | null;
  status?: string;
  rating?: number | null;
  hoursPlayed?: number | null;
};

export function GameCard({ game, href, className }: { game: GameCardData; href?: string; className?: string }) {
  const body = (
    <>
      <div className="relative">
        <GameCover src={game.coverUrl} title={game.title} className="rounded-t-2xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-surface to-transparent" />
        {game.rating ? <RatingPill rating={game.rating} className="absolute right-2 top-2 bg-bg/70" /> : null}
        {game.status && <StatusBadge status={game.status} className="absolute bottom-2 left-2 bg-bg/80 backdrop-blur" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 font-semibold leading-snug text-ink transition group-hover:text-cyan">{game.title}</h3>
        {game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {game.genres.slice(0, 2).map((g) => (
              <span key={g} className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                {g}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
          {game.platform && (
            <span className="inline-flex items-center gap-1">
              <Monitor className="size-3" />
              {game.platform}
            </span>
          )}
          {game.releaseYear && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-3" />
              {game.releaseYear}
            </span>
          )}
          {game.hoursPlayed ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {Math.round(game.hoursPlayed)} ч
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const cls = cn(
    "group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-cyan/50 hover:shadow-[0_8px_30px_-6px_rgba(34,211,238,0.35)]",
    className,
  );

  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function GameGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{children}</div>;
}
