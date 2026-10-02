import "server-only";
import type { Game } from "@prisma/client";
import { db } from "./db";
import { normalizeGenres, normalizePlatforms } from "./taxonomy";

type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  background_image: string | null;
  genres?: { slug: string; name: string }[];
  tags?: { slug: string }[];
  platforms?: { platform: { slug: string; name: string } }[] | null;
};

export const hasRawg = () => Boolean(process.env.RAWG_API_KEY);

async function fetchRawg(query: string, pageSize: number): Promise<RawgGame[]> {
  const url = new URL("https://api.rawg.io/api/games");
  url.searchParams.set("key", process.env.RAWG_API_KEY!);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", String(pageSize));
  url.searchParams.set("search_precise", "true");
  const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
  if (!res.ok) throw new Error(`RAWG ${res.status}`);
  const data = (await res.json()) as { results: RawgGame[] };
  return data.results ?? [];
}

/** Уменьшенная копия с CDN RAWG: ~50 КБ вместо ~700 КБ оригинала. */
function rawgThumb(url: string | null) {
  return url?.includes("media.rawg.io/media/") && !url.includes("/media/resize/")
    ? url.replace("/media/", "/media/resize/640/-/")
    : url;
}

/** Кэширует игру из RAWG в локальной таблице Game. */
async function upsertRawg(g: RawgGame): Promise<Game> {
  const data = {
    title: g.name,
    coverUrl: rawgThumb(g.background_image),
    genres: JSON.stringify(normalizeGenres(g.genres ?? [], g.tags ?? [])),
    platforms: JSON.stringify(normalizePlatforms((g.platforms ?? []).map((p) => p.platform))),
    releaseYear: g.released ? Number(g.released.slice(0, 4)) : null,
  };
  const existing = await db.game.findFirst({ where: { OR: [{ rawgId: g.id }, { slug: g.slug }] } });
  if (existing) {
    // Не затираем обложки сида пустыми значениями из RAWG
    return db.game.update({
      where: { id: existing.id },
      data: { ...data, rawgId: g.id, coverUrl: existing.coverUrl ?? data.coverUrl },
    });
  }
  return db.game.create({ data: { ...data, rawgId: g.id, slug: g.slug } });
}

async function searchLocal(query: string, take: number) {
  const q = query.trim();
  return db.game.findMany({
    where: q ? { title: { contains: q } } : undefined,
    orderBy: q ? { title: "asc" } : { createdAt: "asc" },
    take,
  });
}

/** Поиск по каталогу: RAWG, если есть ключ, иначе (или при ошибке) — локальный каталог. */
export async function searchGames(query: string, take = 24): Promise<{ games: Game[]; source: "rawg" | "local" }> {
  const q = query.trim();
  if (q.length >= 2 && hasRawg()) {
    try {
      const results = await fetchRawg(q, Math.min(take, 20));
      const games = await Promise.all(results.map(upsertRawg));
      return { games, source: "rawg" };
    } catch (e) {
      console.error("[rawg] search failed, falling back to local catalog", e);
    }
  }
  return { games: await searchLocal(q, take), source: "local" };
}

/** Находит игру по названию (для резолва AI-рекомендаций): сначала локально, затем в RAWG. */
export async function findGameByTitle(title: string): Promise<Game | null> {
  const local = await db.game.findFirst({ where: { title: { equals: title } } });
  if (local) return local;
  const fuzzy = await db.game.findFirst({ where: { title: { contains: title } } });
  if (fuzzy) return fuzzy;
  if (!hasRawg()) return null;
  try {
    const [first] = await fetchRawg(title, 1);
    return first ? upsertRawg(first) : null;
  } catch {
    return null;
  }
}
