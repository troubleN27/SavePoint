"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, Check, Sparkles } from "lucide-react";
import { GameCover } from "./GameCover";
import { cn, pluralize } from "@/lib/utils";

type GameBit = {
  title: string;
  coverUrl: string | null;
  rating: number | null;
  hours: number | null;
  genres: string[];
  review: string | null;
} | null;

export type WrappedData = {
  year: number;
  years: number[];
  name: string;
  username: string;
  isPublic: boolean;
  completedCount: number;
  addedCount: number;
  droppedCount: number;
  hours: number;
  avgRating: number | null;
  topGenres: { name: string; count: number }[];
  topPlatform: { name: string; count: number; hours: number } | null;
  gameOfYear: GameBit;
  longest: GameBit;
  busiestMonth: number | null;
  monthCounts: number[];
  archetype: { title: string; text: string };
  covers: { title: string; coverUrl: string | null }[];
};

const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const MONTHS_SHORT = ["Я", "Ф", "М", "А", "М", "И", "И", "А", "С", "О", "Н", "Д"];

const BACKGROUNDS = [
  "from-magenta/50 via-violet/30 to-bg",
  "from-cyan/45 via-violet/25 to-bg",
  "from-lime/35 via-cyan/25 to-bg",
  "from-violet/50 via-magenta/25 to-bg",
  "from-amber/35 via-red/30 to-bg",
  "from-cyan/40 via-magenta/30 to-bg",
  "from-red/40 via-violet/30 to-bg",
  "from-magenta/40 via-cyan/30 to-bg",
];

function Big({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("font-display text-7xl font-black leading-none sm:text-8xl", className)}>{children}</div>;
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink/70">{children}</p>;
}

export function Wrapped({ data }: { data: WrappedData }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [copied, setCopied] = useState(false);
  const empty = data.completedCount === 0 && data.hours === 0;

  const slides: React.ReactNode[] = empty
    ? [
        <div key="empty" className="space-y-4">
          <Kicker>Итог {data.year}</Kicker>
          <h2 className="font-display text-4xl font-black">Пока тихо…</h2>
          <p className="text-lg text-ink/80">
            В {data.year} году в коллекции нет пройденных игр и часов. Отмечай прохождения — и итог года соберётся сам.
          </p>
          <Link href="/library" className="inline-block rounded-xl bg-ink px-5 py-3 font-semibold text-bg">
            К коллекции
          </Link>
        </div>,
      ]
    : [
        <div key="intro" className="space-y-6">
          <Kicker>SavePoint Wrapped</Kicker>
          <h2 className="font-display text-5xl font-black leading-[1.05] sm:text-6xl">
            {data.name}, это был
            <br />
            <span className="text-neon-cyan">твой {data.year}</span>
            <br />в играх
          </h2>
          <p className="text-ink/70">Жми → или тапай по экрану</p>
        </div>,

        <div key="count" className="space-y-5">
          <Kicker>Ты прошёл</Kicker>
          <Big className="text-neon-cyan">{data.completedCount}</Big>
          <p className="text-2xl font-semibold">
            {pluralize(data.completedCount, ["игру", "игры", "игр"])} за год
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {data.covers.slice(0, 8).map((c) => (
              <div key={c.title} className="w-14 overflow-hidden rounded-md shadow-lg sm:w-16">
                <GameCover src={c.coverUrl} title={c.title} />
              </div>
            ))}
          </div>
          {data.droppedCount > 0 && (
            <p className="text-ink/70">
              …и честно бросил {data.droppedCount} {pluralize(data.droppedCount, ["игру", "игры", "игр"])}. Бывает.
            </p>
          )}
        </div>,

        <div key="hours" className="space-y-5">
          <Kicker>В играх ты провёл</Kicker>
          <Big className="text-neon-magenta">{data.hours}</Big>
          <p className="text-2xl font-semibold">{pluralize(data.hours, ["час", "часа", "часов"])}</p>
          <p className="text-lg text-ink/80">
            Это примерно {Math.max(1, Math.round(data.hours / 24))} {pluralize(Math.max(1, Math.round(data.hours / 24)), ["сутки", "суток", "суток"])} без
            перерыва.
            {data.longest?.hours ? ` Больше всего — в «${data.longest.title}»: ${data.longest.hours} ч.` : ""}
          </p>
        </div>,

        <div key="genres" className="space-y-5">
          <Kicker>Твой жанр года</Kicker>
          <h2 className="font-display text-5xl font-black text-neon-cyan sm:text-6xl">{data.topGenres[0]?.name ?? "—"}</h2>
          <ol className="space-y-2.5 pt-2">
            {data.topGenres.map((g, idx) => (
              <li key={g.name} className="flex items-center gap-4 text-lg">
                <span className="w-6 font-display text-ink/50">{idx + 1}</span>
                <span className="flex-1 font-semibold">{g.name}</span>
                <span className="text-ink/60">{g.count}</span>
              </li>
            ))}
          </ol>
        </div>,

        <div key="platform" className="space-y-5">
          <Kicker>Главная платформа</Kicker>
          <h2 className="font-display text-6xl font-black text-neon-magenta sm:text-7xl">{data.topPlatform?.name ?? "—"}</h2>
          {data.topPlatform && (
            <p className="text-xl text-ink/80">
              {data.topPlatform.count} {pluralize(data.topPlatform.count, ["игра", "игры", "игр"])} и {data.topPlatform.hours} ч
            </p>
          )}
          <div className="pt-4">
            <p className="mb-3 text-sm text-ink/60">
              Прохождения по месяцам{data.busiestMonth !== null ? ` · пик — ${MONTHS[data.busiestMonth]}` : ""}
            </p>
            <div className="flex h-28 items-end gap-1.5">
              {data.monthCounts.map((c, m) => {
                const max = Math.max(1, ...data.monthCounts);
                return (
                  <div key={m} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={cn("w-full rounded-t", m === data.busiestMonth ? "bg-ink shadow-[0_0_14px_white]" : "bg-ink/35")}
                      style={{ height: `${Math.max(4, (c / max) * 96)}px` }}
                      title={`${MONTHS[m]}: ${c}`}
                    />
                    <span className="text-[10px] text-ink/50">{MONTHS_SHORT[m]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>,

        ...(data.gameOfYear
          ? [
              <div key="goty" className="grid items-center gap-6 sm:grid-cols-[200px_1fr]">
                <div className="mx-auto w-40 overflow-hidden rounded-2xl shadow-[0_0_50px_rgba(232,121,249,0.6)] sm:w-full">
                  <GameCover src={data.gameOfYear.coverUrl} title={data.gameOfYear.title} />
                </div>
                <div className="space-y-3 text-center sm:text-left">
                  <Kicker>Твоя игра года</Kicker>
                  <h2 className="font-display text-3xl font-black leading-tight sm:text-4xl">{data.gameOfYear.title}</h2>
                  {data.gameOfYear.rating && (
                    <p className="font-display text-5xl font-black text-neon-cyan">
                      {data.gameOfYear.rating}
                      <span className="text-2xl text-ink/50">/10</span>
                    </p>
                  )}
                  {data.gameOfYear.review && <p className="italic text-ink/80">«{data.gameOfYear.review.slice(0, 180)}»</p>}
                </div>
              </div>,
            ]
          : []),

        <div key="arch" className="space-y-5 text-center">
          <Kicker>Твой игровой архетип</Kicker>
          <div className="text-7xl animate-float" aria-hidden>
            🕹️
          </div>
          <h2 className="font-display text-4xl font-black text-gradient sm:text-5xl">{data.archetype.title}</h2>
          <p className="mx-auto max-w-md text-lg text-ink/85">{data.archetype.text}</p>
        </div>,

        <div key="summary" className="space-y-5">
          <Kicker>Итог {data.year}</Kicker>
          <div className="neon-border rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold">
                Save<span className="text-red">Point</span> · {data.year}
              </span>
              <span className="text-sm text-ink/60">@{data.username}</span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <SummaryStat label="Пройдено" value={data.completedCount} />
              <SummaryStat label="Часов" value={data.hours} />
              <SummaryStat label="Жанр года" value={data.topGenres[0]?.name ?? "—"} small />
              <SummaryStat label="Платформа" value={data.topPlatform?.name ?? "—"} small />
              <SummaryStat label="Игра года" value={data.gameOfYear?.title ?? "—"} small wide />
              <SummaryStat label="Архетип" value={data.archetype.title} small wide />
            </div>
          </div>
          <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
            {data.isPublic ? (
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(`${location.origin}/u/${data.username}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-bg"
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Ссылка скопирована" : "Поделиться профилем"}
              </button>
            ) : (
              <Link href="/settings" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-bg">
                Открыть профиль, чтобы делиться
              </Link>
            )}
            <button
              onClick={() => setI(0)}
              className="cursor-pointer rounded-xl border border-ink/30 px-4 py-2.5 text-sm font-semibold"
            >
              Смотреть снова
            </button>
          </div>
        </div>,
      ];

  const total = slides.length;
  const go = useCallback((d: number) => setI((x) => Math.min(total - 1, Math.max(0, x + d))), [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  useEffect(() => setI(0), [data.year]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-xl font-bold">
          <Sparkles className="size-5 text-magenta" /> Игровой итог года
        </h1>
        <select
          aria-label="Год"
          value={data.year}
          onChange={(e) => router.push(`/wrapped/${e.target.value}`)}
          className="h-9 cursor-pointer rounded-lg border border-line bg-surface px-3 text-sm"
        >
          {data.years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div
        className={cn(
          "relative min-h-[560px] select-none overflow-hidden rounded-3xl border border-line bg-gradient-to-br transition-colors duration-700",
          BACKGROUNDS[i % BACKGROUNDS.length],
        )}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          go(e.clientX - rect.left < rect.width / 3 ? -1 : 1);
        }}
      >
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="absolute inset-x-4 top-4 z-10 flex gap-1">
          {slides.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/20">
              <div className={cn("h-full bg-ink transition-all duration-500", idx <= i ? "w-full" : "w-0")} />
            </div>
          ))}
        </div>
        <div key={i} className="relative flex min-h-[560px] animate-slide-up flex-col justify-center p-7 pt-12 sm:p-12">
          {slides[i]}
        </div>
        <button
          aria-label="Назад"
          onClick={(e) => {
            e.stopPropagation();
            go(-1);
          }}
          className={cn("absolute bottom-4 left-4 cursor-pointer rounded-full bg-bg/50 p-2 backdrop-blur", i === 0 && "invisible")}
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          aria-label="Дальше"
          onClick={(e) => {
            e.stopPropagation();
            go(1);
          }}
          className={cn("absolute bottom-4 right-4 cursor-pointer rounded-full bg-bg/50 p-2 backdrop-blur", i === total - 1 && "invisible")}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, small, wide }: { label: string; value: React.ReactNode; small?: boolean; wide?: boolean }) {
  return (
    <div className={cn(wide && "col-span-2")}>
      <div className="text-xs uppercase tracking-wider text-ink/50">{label}</div>
      <div className={cn("font-display font-black", small ? "text-lg leading-tight" : "text-4xl text-neon-cyan")}>{value}</div>
    </div>
  );
}

export function WrappedPreview() {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-magenta/50 via-violet/30 to-bg p-12">
      <p className="text-sm uppercase tracking-widest">SavePoint Wrapped</p>
      <h2 className="mt-6 font-display text-6xl font-black">
        Твой 2026
        <br />в играх
      </h2>
      <div className="mt-10 font-display text-8xl font-black text-cyan">42</div>
      <p className="text-2xl">игры пройдено</p>
    </div>
  );
}
