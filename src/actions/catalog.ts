"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { searchGames } from "@/lib/rawg";
import { parseList } from "@/lib/utils";

export type CatalogGame = {
  id: string;
  title: string;
  coverUrl: string | null;
  genres: string[];
  platforms: string[];
  releaseYear: number | null;
  inCollection: string | null; // id записи UserGame, если уже добавлена
};

export async function searchCatalog(query: string): Promise<{ games: CatalogGame[]; source: "rawg" | "local" }> {
  const user = await getCurrentUser();
  if (!user) return { games: [], source: "local" };
  const { games, source } = await searchGames(query.slice(0, 100));
  const owned = await db.userGame.findMany({
    where: { userId: user.id, gameId: { in: games.map((g) => g.id) } },
    select: { id: true, gameId: true },
  });
  const ownedMap = new Map(owned.map((o) => [o.gameId, o.id]));
  return {
    source,
    games: games.map((g) => ({
      id: g.id,
      title: g.title,
      coverUrl: g.coverUrl,
      genres: parseList(g.genres),
      platforms: parseList(g.platforms),
      releaseYear: g.releaseYear,
      inCollection: ownedMap.get(g.id) ?? null,
    })),
  };
}
