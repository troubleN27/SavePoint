"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { STATUSES, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

const selectCls =
  "h-10 rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition hover:border-faint focus:border-cyan/60 cursor-pointer";

export function LibraryFilters({ genres, counts }: { genres: string[]; counts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  };

  // Поиск с задержкой, чтобы не дёргать сервер на каждую букву
  useEffect(() => {
    if ((params.get("q") ?? "") === q) return;
    const t = setTimeout(() => update({ q: q.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const status = params.get("status") ?? "";
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const hasFilters = ["q", "status", "genre", "minRating"].some((k) => params.get(k));

  return (
    <div className="mb-6 space-y-4">
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ key: "", label: "Все", count: total }, ...STATUSES.map((s) => ({ key: s, label: STATUS_META[s].label, count: counts[s] ?? 0 }))].map(
          (tab) => (
            <button
              key={tab.key}
              onClick={() => update({ status: tab.key || null })}
              className={cn(
                "shrink-0 cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition",
                status === tab.key
                  ? "border-cyan/50 bg-cyan/10 text-cyan shadow-[0_0_16px_rgba(34,211,238,0.2)]"
                  : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>
            </button>
          ),
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <label className="relative min-w-0 flex-1 sm:min-w-64">
          <span className="sr-only">Поиск по коллекции</span>
          {pending ? (
            <Loader2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-cyan" />
          ) : (
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          )}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по названию…"
            className="h-10 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm outline-none transition placeholder:text-faint focus:border-cyan/60 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
          />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <select
            aria-label="Жанр"
            value={params.get("genre") ?? ""}
            onChange={(e) => update({ genre: e.target.value || null })}
            className={selectCls}
          >
            <option value="">Все жанры</option>
            {genres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            aria-label="Оценка"
            value={params.get("minRating") ?? ""}
            onChange={(e) => update({ minRating: e.target.value || null })}
            className={selectCls}
          >
            <option value="">Любая оценка</option>
            <option value="9">9+ шедевры</option>
            <option value="7">7+ хорошие</option>
            <option value="5">5+ средние</option>
            <option value="1">С оценкой</option>
            <option value="none">Без оценки</option>
          </select>
          <select
            aria-label="Сортировка"
            value={params.get("sort") ?? "updated"}
            onChange={(e) => update({ sort: e.target.value === "updated" ? null : e.target.value })}
            className={cn(selectCls, "col-span-2 sm:col-span-1")}
          >
            <option value="updated">Недавно изменённые</option>
            <option value="rating">По оценке</option>
            <option value="title">По названию</option>
            <option value="year">По году выхода</option>
            <option value="hours">По часам</option>
          </select>
        </div>
        {hasFilters && (
          <button
            onClick={() => {
              setQ("");
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-1 rounded-xl px-3 text-sm text-muted hover:text-red"
          >
            <X className="size-4" /> Сбросить
          </button>
        )}
      </div>
    </div>
  );
}
