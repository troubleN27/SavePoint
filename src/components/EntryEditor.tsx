"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Library, Loader2, Lock, Trash2 } from "lucide-react";
import { removeEntry, updateEntry } from "@/actions/collection";
import { toggleShelfItem } from "@/actions/shelves";
import { STATUSES, STATUS_META, type GameStatus } from "@/lib/constants";
import { REVIEW_MAX } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { useUpgrade } from "./UpgradeModal";
import { Button } from "./ui/Button";
import { ProBadge, ratingTone } from "./ui/Badge";

type Props = {
  entry: {
    id: string;
    status: string;
    rating: number | null;
    review: string | null;
    hoursPlayed: number | null;
    platformPlayed: string | null;
    completedAt: string | null;
  };
  platforms: string[];
  shelves: { id: string; name: string; has: boolean }[];
};

const STATUS_STYLES: Record<GameStatus, string> = {
  PLAYING: "border-cyan/60 bg-cyan/10 text-cyan shadow-[0_0_18px_rgba(34,211,238,0.25)]",
  COMPLETED: "border-lime/60 bg-lime/10 text-lime shadow-[0_0_18px_rgba(163,230,53,0.25)]",
  WANT: "border-violet/60 bg-violet/10 text-violet shadow-[0_0_18px_rgba(167,139,250,0.25)]",
  DROPPED: "border-red/60 bg-red/10 text-red shadow-[0_0_18px_rgba(255,40,0,0.25)]",
};

const RATING_STYLES = {
  lime: "border-lime bg-lime text-bg shadow-[0_0_14px_rgba(163,230,53,0.6)]",
  cyan: "border-cyan bg-cyan text-bg shadow-[0_0_14px_rgba(34,211,238,0.6)]",
  amber: "border-amber bg-amber text-bg shadow-[0_0_14px_rgba(251,191,36,0.6)]",
  red: "border-red bg-red text-bg shadow-[0_0_14px_rgba(255,40,0,0.6)]",
} as Record<string, string>;

const labelCls = "mb-2 block text-xs font-semibold uppercase tracking-wider text-faint";
const inputCls =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-cyan/60";

export function EntryEditor({ entry, platforms, shelves }: Props) {
  const router = useRouter();
  const { isPro, openUpgrade } = useUpgrade();
  const [status, setStatus] = useState(entry.status as GameStatus);
  const [rating, setRating] = useState<number | null>(entry.rating);
  const [hover, setHover] = useState<number | null>(null);
  const [review, setReview] = useState(entry.review ?? "");
  const [hours, setHours] = useState(entry.hoursPlayed?.toString() ?? "");
  const [platform, setPlatform] = useState(entry.platformPlayed ?? platforms[0] ?? "");
  const [completedAt, setCompletedAt] = useState(entry.completedAt?.slice(0, 10) ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [shelfState, setShelfState] = useState(shelves);

  const max = isPro ? REVIEW_MAX.PRO : REVIEW_MAX.FREE;
  const shown = hover ?? rating;

  const save = () =>
    startTransition(async () => {
      setError(null);
      const res = await updateEntry(entry.id, {
        status,
        rating,
        review: review.trim() || null,
        hoursPlayed: hours === "" ? null : Number(hours),
        platformPlayed: platform || null,
        completedAt: status === "COMPLETED" && completedAt ? completedAt : null,
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        router.refresh();
      } else if (res.code === "PRO_REQUIRED") openUpgrade("review");
      else setError(res.error);
    });

  const remove = () => {
    if (!confirm("Удалить игру из коллекции?")) return;
    startTransition(async () => {
      await removeEntry(entry.id);
      router.push("/library");
    });
  };

  const toggleShelf = (shelfId: string) =>
    startTransition(async () => {
      const res = await toggleShelfItem(shelfId, entry.id);
      if (res.ok) setShelfState((s) => s.map((x) => (x.id === shelfId ? { ...x, has: res.data.added } : x)));
    });

  return (
    <div className="space-y-7">
      <section>
        <span className={labelCls}>Статус</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "h-11 cursor-pointer rounded-xl border text-sm font-medium transition",
                status === s ? STATUS_STYLES[s] : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {STATUS_META[s].label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className={cn(labelCls, "mb-0")}>Оценка</span>
          <span className="font-display text-sm text-muted">
            {shown ? <span className="text-ink">{shown}</span> : "—"}/10
            {rating && (
              <button onClick={() => setRating(null)} className="ml-3 cursor-pointer text-xs text-faint hover:text-red">
                сбросить
              </button>
            )}
          </span>
        </div>
        <div className="grid grid-cols-10 gap-1 sm:gap-1.5" onMouseLeave={() => setHover(null)}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const active = shown !== null && n <= shown;
            return (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`Оценка ${n}`}
                className={cn(
                  "aspect-square cursor-pointer rounded-lg border font-display text-xs font-bold transition sm:text-sm",
                  active ? RATING_STYLES[ratingTone(shown!)] : "border-line bg-surface text-faint hover:border-faint",
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <label>
          <span className={labelCls}>Часов в игре</span>
          <input type="number" min={0} step={0.5} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="0" className={inputCls} />
        </label>
        <label>
          <span className={labelCls}>Платформа</span>
          <input list="platforms" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="PC" className={inputCls} />
          <datalist id="platforms">
            {platforms.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>
        <label className={cn(status !== "COMPLETED" && "opacity-40")}>
          <span className={labelCls}>Дата прохождения</span>
          <input
            type="date"
            disabled={status !== "COMPLETED"}
            value={completedAt}
            onChange={(e) => setCompletedAt(e.target.value)}
            className={cn(inputCls, "[color-scheme:dark]")}
          />
        </label>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <span className={cn(labelCls, "mb-0")}>Отзыв</span>
          <span className={cn("text-xs", review.length > max ? "text-red" : "text-faint")}>
            {review.length}/{max}
            {!isPro && (
              <button onClick={() => openUpgrade("review")} className="ml-2 cursor-pointer align-middle">
                <ProBadge />
              </button>
            )}
          </span>
        </div>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={isPro ? 8 : 4}
          placeholder={isPro ? "Подробная рецензия: сюжет, геймплей, атмосфера…" : "Коротко: что понравилось, а что нет?"}
          className="w-full resize-y rounded-xl border border-line bg-surface p-3 text-sm leading-relaxed outline-none transition placeholder:text-faint focus:border-cyan/60"
        />
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <span className={cn(labelCls, "mb-0")}>Полки</span>
          {!isPro && <ProBadge />}
        </div>
        {isPro ? (
          shelfState.length ? (
            <div className="flex flex-wrap gap-2">
              {shelfState.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleShelf(s.id)}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition",
                    s.has ? "border-magenta/50 bg-magenta/10 text-magenta" : "border-line text-muted hover:text-ink",
                  )}
                >
                  {s.has ? <Check className="size-3.5" /> : <Library className="size-3.5" />}
                  {s.name}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">
              У тебя пока нет полок.{" "}
              <Link href="/shelves" className="text-cyan hover:underline">
                Создать полку
              </Link>
            </p>
          )
        ) : (
          <button
            onClick={() => openUpgrade("shelves")}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-muted hover:border-magenta/50 hover:text-magenta"
          >
            <Lock className="size-3.5" /> Добавить на полку
          </button>
        )}
      </section>

      {error && <p className="text-sm text-red">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        <Button size="lg" onClick={save} disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
          {saved ? "Сохранено" : "Сохранить"}
        </Button>
        <Button variant="danger" size="lg" onClick={remove} disabled={pending} className="ml-auto">
          <Trash2 className="size-4" /> Удалить
        </Button>
      </div>
    </div>
  );
}
