"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Loader2, PenLine, Plus, Search } from "lucide-react";
import { searchCatalog, type CatalogGame } from "@/actions/catalog";
import { addCustomGame, addToCollection } from "@/actions/collection";
import type { ActionError } from "@/actions/types";
import { STATUSES, STATUS_META } from "@/lib/constants";
import { GameCover } from "./GameCover";
import { GameGrid } from "./GameCard";
import { useUpgrade } from "./UpgradeModal";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

const inputCls =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition placeholder:text-faint focus:border-cyan/60";

export function AddGame({ rawgEnabled, initial }: { rawgEnabled: boolean; initial: CatalogGame[] }) {
  const [query, setQuery] = useState("");
  const [games, setGames] = useState(initial);
  const [source, setSource] = useState<"rawg" | "local">("local");
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await searchCatalog(query);
      if (id === reqId.current) {
        setGames(res.games);
        setSource(res.source);
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-4 top-1/2 size-5 -translate-y-1/2 animate-spin text-cyan" />
        ) : (
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-faint" />
        )}
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найди игру: Elden Ring, Hades, Silent Hill…"
          className="h-14 w-full rounded-2xl border border-line bg-surface pl-12 pr-4 text-base outline-none transition placeholder:text-faint focus:border-cyan/60 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.12),0_0_30px_rgba(34,211,238,0.15)]"
        />
      </div>
      <p className="text-xs text-faint">
        {rawgEnabled ? (
          <>
            {source === "rawg" ? "Результаты поиска" : "Популярные игры · введи минимум 2 символа для поиска"}. Данные об играх
            предоставлены{" "}
            <a href="https://rawg.io" target="_blank" rel="noopener noreferrer" className="text-muted underline hover:text-red">
              RAWG
            </a>
          </>
        ) : (
          "Поиск по встроенному каталогу SavePoint. Не нашёл игру? Добавь её вручную ниже."
        )}
      </p>

      {games.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-line py-12 text-center text-muted">
          Ничего не найдено по запросу «{query}». Добавь игру вручную ↓
        </div>
      ) : (
        <GameGrid>
          {games.map((g) => (
            <CatalogCard key={g.id} game={g} />
          ))}
        </GameGrid>
      )}

      <CustomGameForm defaultTitle={query} />
    </div>
  );
}

function CatalogCard({ game }: { game: CatalogGame }) {
  const { openUpgrade } = useUpgrade();
  const [entryId, setEntryId] = useState(game.inCollection);
  const [pending, startTransition] = useTransition();
  const [menu, setMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = (status: string) =>
    startTransition(async () => {
      setMenu(false);
      setError(null);
      const res = await addToCollection(game.id, status);
      if (res.ok) setEntryId(res.data.id);
      else if (res.code === "LIMIT") openUpgrade("unlimited");
      else setError(res.error);
    });

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-cyan/40">
      <GameCover src={game.coverUrl} title={game.title} />
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{game.title}</h3>
        <p className="line-clamp-1 text-xs text-muted">{game.genres.slice(0, 2).join(", ") || "—"}</p>
        <p className="line-clamp-1 text-xs text-faint">
          {[game.platforms.slice(0, 2).join(", "), game.releaseYear].filter(Boolean).join(" · ")}
        </p>
        <div className="relative mt-auto pt-2">
          {entryId ? (
            <Link
              href={`/game/${entryId}`}
              className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-lime/40 bg-lime/10 text-xs font-medium text-lime"
            >
              <Check className="size-3.5" /> В коллекции
            </Link>
          ) : (
            <div className="flex">
              <button
                onClick={() => add("WANT")}
                disabled={pending}
                className="flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-l-lg bg-red text-xs font-semibold text-bg shadow-[0_0_12px_rgba(255,40,0,0.35)] transition hover:bg-red/90 disabled:opacity-60"
              >
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                Добавить
              </button>
              <button
                onClick={() => setMenu((m) => !m)}
                aria-label="Выбрать статус"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-r-lg border-l border-bg/30 bg-red text-bg hover:bg-red/90"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>
          )}
          {menu && (
            <div className="absolute bottom-10 left-0 right-0 z-10 overflow-hidden rounded-xl border border-line bg-surface-2 shadow-xl">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => add(s)}
                  className="block w-full cursor-pointer px-3 py-2 text-left text-xs hover:bg-red/10 hover:text-red"
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          )}
          {error && <p className="mt-1 text-[11px] text-red">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function CustomGameForm({ defaultTitle }: { defaultTitle: string }) {
  const router = useRouter();
  const { openUpgrade } = useUpgrade();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-2xl border border-line bg-surface/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left"
        aria-expanded={open}
      >
        <PenLine className="size-5 text-magenta" />
        <span className="flex-1">
          <span className="font-medium">Добавить игру вручную</span>
          <span className="block text-xs text-muted">Если игры нет в каталоге</span>
        </span>
        <ChevronDown className={cn("size-4 text-muted transition", open && "rotate-180")} />
      </button>
      {open && (
        <form
          className="grid gap-3 border-t border-line p-4 sm:grid-cols-2"
          action={(fd) =>
            startTransition(async () => {
              setError(null);
              const res = await addCustomGame(fd);
              if (res.ok) router.push(`/game/${res.data.id}`);
              else if ((res as ActionError).code === "LIMIT") openUpgrade("unlimited");
              else setError(res.error);
            })
          }
        >
          <input name="title" required defaultValue={defaultTitle} placeholder="Название *" className={cn(inputCls, "sm:col-span-2")} />
          <input name="genre" placeholder="Жанры через запятую (RPG, Хоррор)" className={inputCls} />
          <input name="platform" placeholder="Платформа (PC, PS5…)" className={inputCls} />
          <input name="year" type="number" min={1950} max={2100} placeholder="Год выхода" className={inputCls} />
          <input name="coverUrl" type="url" placeholder="Ссылка на обложку (необязательно)" className={inputCls} />
          {error && <p className="text-sm text-red sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <Button disabled={pending}>{pending ? "Добавляем…" : "Добавить в коллекцию"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
