"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bot, Check, Cpu, Loader2, Plus, RefreshCw } from "lucide-react";
import { refreshRecommendations } from "@/actions/recommendations";
import { addToCollection } from "@/actions/collection";
import type { Recommendation, RecommendationResult } from "@/lib/recommendations";
import { GameCover } from "./GameCover";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { useUpgrade } from "./UpgradeModal";

export function Recommendations({ initial }: { initial: RecommendationResult }) {
  const [result, setResult] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = () =>
    startTransition(async () => {
      setError(null);
      const res = await refreshRecommendations();
      if (res.ok) setResult(res.data);
      else setError(res.error);
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {result.source === "ai" ? (
          <Badge tone="magenta" className="px-2 py-1 text-xs">
            <Bot className="size-3.5" /> Подобрано AI
            {result.provider === "gemini" ? " · Gemini" : result.provider === "claude" ? " · Claude" : ""}
          </Badge>
        ) : (
          <Badge tone="cyan" className="px-2 py-1 text-xs">
            <Cpu className="size-3.5" /> Подобрано по твоим жанрам
          </Badge>
        )}
        <span className="text-xs text-faint">обновлено {new Date(result.createdAt).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}</span>
        <Button variant="outline" size="sm" onClick={refresh} disabled={pending} className="ml-auto">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          {pending ? "Подбираем…" : "Обновить"}
        </Button>
      </div>
      {result.note && <p className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-3 text-sm text-amber">{result.note}</p>}
      {error && <p className="text-sm text-red">{error}</p>}

      <div className={pending ? "pointer-events-none opacity-50 transition" : "transition"}>
        {result.items.length === 0 ? (
          <p className="py-16 text-center text-muted">Добавь и оцени несколько игр — и мы подберём, что пройти дальше.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {result.items.map((r, i) => (
              <RecCard key={`${r.title}-${i}`} rec={r} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecCard({ rec, index }: { rec: Recommendation; index: number }) {
  const { openUpgrade } = useUpgrade();
  const [entryId, setEntryId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const add = () =>
    rec.gameId &&
    startTransition(async () => {
      const res = await addToCollection(rec.gameId!, "WANT");
      if (res.ok) setEntryId(res.data.id);
      else if (res.code === "LIMIT") openUpgrade("unlimited");
    });

  return (
    <article
      className="flex animate-slide-up gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-magenta/40"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="w-24 shrink-0 overflow-hidden rounded-xl sm:w-28">
        <GameCover src={rec.coverUrl} title={rec.title} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-semibold leading-snug">{rec.title}</h3>
        <p className="mt-0.5 text-xs text-faint">
          {[rec.genres.slice(0, 2).join(", "), rec.platforms.slice(0, 2).join(", "), rec.releaseYear].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{rec.reason}</p>
        <div className="mt-auto pt-3">
          {entryId ? (
            <Link href={`/game/${entryId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-lime">
              <Check className="size-4" /> В списке «Хочу пройти»
            </Link>
          ) : rec.gameId ? (
            <Button size="sm" variant="outline" onClick={add} disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Хочу пройти
            </Button>
          ) : (
            <Link href="/library/add" className="text-sm text-cyan hover:underline">
              Найти в каталоге →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
