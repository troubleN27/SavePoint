import type { Metadata } from "next";
import { Plus, SearchX } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isStatus } from "@/lib/constants";
import { FREE_GAME_LIMIT, isPro } from "@/lib/plans";
import { parseList, pluralize } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { LibraryFilters } from "@/components/LibraryFilters";
import { GameCard, GameGrid } from "@/components/GameCard";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Коллекция" };

type SP = Promise<Record<string, string | undefined>>;

const ORDER: Record<string, Prisma.UserGameOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: "desc" }],
  rating: [{ rating: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
  title: [{ game: { title: "asc" } }],
  year: [{ game: { releaseYear: { sort: "desc", nulls: "last" } } }],
  hours: [{ hoursPlayed: { sort: "desc", nulls: "last" } }],
};

export default async function LibraryPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;

  const where: Prisma.UserGameWhereInput = { userId: user.id };
  if (isStatus(sp.status)) where.status = sp.status;
  if (sp.minRating === "none") where.rating = null;
  else if (sp.minRating && Number(sp.minRating) > 0) where.rating = { gte: Number(sp.minRating) };
  const gameWhere: Prisma.GameWhereInput = {};
  if (sp.q) gameWhere.title = { contains: sp.q, mode: "insensitive" };
  if (sp.genre) gameWhere.genres = { contains: JSON.stringify(sp.genre) };
  if (Object.keys(gameWhere).length) where.game = gameWhere;

  const [entries, all] = await Promise.all([
    db.userGame.findMany({ where, include: { game: true }, orderBy: ORDER[sp.sort ?? "updated"] ?? ORDER.updated }),
    db.userGame.findMany({ where: { userId: user.id }, select: { status: true, game: { select: { genres: true } } } }),
  ]);

  const counts: Record<string, number> = {};
  const genreSet = new Set<string>();
  for (const e of all) {
    counts[e.status] = (counts[e.status] ?? 0) + 1;
    parseList(e.game.genres).forEach((g) => genreSet.add(g));
  }
  const genres = [...genreSet].sort((a, b) => a.localeCompare(b, "ru"));

  return (
    <>
      <PageHeader
        title="Моя коллекция"
        subtitle={
          <>
            {all.length} {pluralize(all.length, ["игра", "игры", "игр"])}
            {!isPro(user) && <span className="text-faint"> · лимит Free: {FREE_GAME_LIMIT}</span>}
          </>
        }
        actions={
          <LinkButton href="/library/add">
            <Plus className="size-4" /> Добавить игру
          </LinkButton>
        }
      />

      {all.length === 0 ? (
        <EmptyLibrary />
      ) : (
        <>
          <LibraryFilters genres={genres} counts={counts} />
          {entries.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-line py-20 text-center">
              <SearchX className="size-10 text-faint" />
              <p className="mt-3 text-muted">Ничего не нашлось — попробуй изменить фильтры.</p>
            </div>
          ) : (
            <GameGrid>
              {entries.map((e) => (
                <GameCard
                  key={e.id}
                  href={`/game/${e.id}`}
                  game={{
                    title: e.game.title,
                    coverUrl: e.game.coverUrl,
                    genres: parseList(e.game.genres),
                    platform: e.platformPlayed ?? parseList(e.game.platforms)[0] ?? null,
                    releaseYear: e.game.releaseYear,
                    status: e.status,
                    rating: e.rating,
                    hoursPlayed: e.hoursPlayed,
                  }}
                />
              ))}
            </GameGrid>
          )}
        </>
      )}
    </>
  );
}

function EmptyLibrary() {
  return (
    <div className="neon-border grid place-items-center rounded-3xl px-6 py-20 text-center">
      <div className="text-6xl animate-float" aria-hidden>
        🎮
      </div>
      <h2 className="mt-6 font-display text-xl font-bold">Твоя коллекция пока пуста</h2>
      <p className="mt-2 max-w-sm text-muted">
        Добавь игры, в которые играешь, которые прошёл или хочешь пройти — и SavePoint начнёт вести твою историю.
      </p>
      <LinkButton href="/library/add" size="lg" className="mt-6">
        <Plus className="size-4" /> Добавить первую игру
      </LinkButton>
    </div>
  );
}
