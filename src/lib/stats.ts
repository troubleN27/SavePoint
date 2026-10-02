import "server-only";
import type { Game, UserGame } from "@prisma/client";
import { db } from "./db";
import { parseList } from "./utils";
import { STATUSES, type GameStatus } from "./constants";

export type Entry = UserGame & { game: Game };

type Bucket = { name: string; count: number; hours: number; avgRating: number | null };

function bucketize(entries: Entry[], keys: (e: Entry) => string[]): Bucket[] {
  const map = new Map<string, { count: number; hours: number; ratingSum: number; rated: number }>();
  for (const e of entries) {
    for (const k of keys(e)) {
      const b = map.get(k) ?? { count: 0, hours: 0, ratingSum: 0, rated: 0 };
      b.count++;
      b.hours += e.hoursPlayed ?? 0;
      if (e.rating) {
        b.ratingSum += e.rating;
        b.rated++;
      }
      map.set(k, b);
    }
  }
  return [...map.entries()]
    .map(([name, b]) => ({
      name,
      count: b.count,
      hours: Math.round(b.hours),
      avgRating: b.rated ? Math.round((b.ratingSum / b.rated) * 10) / 10 : null,
    }))
    .sort((a, b) => b.count - a.count || b.hours - a.hours);
}

export const genresOf = (e: Entry) => parseList(e.game.genres);
export const platformOf = (e: Entry) => [e.platformPlayed || parseList(e.game.platforms)[0] || "Другое"];

export function computeStats(entries: Entry[]) {
  const rated = entries.filter((e) => e.rating);
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<GameStatus, number>;
  for (const e of entries) byStatus[e.status as GameStatus]++;

  const ratingDistribution = Array.from({ length: 10 }, (_, i) => ({
    rating: i + 1,
    count: rated.filter((e) => e.rating === i + 1).length,
  }));

  const genres = bucketize(entries, genresOf);
  // «Любимые» жанры — с учётом и количества, и средней оценки
  const favoriteGenres = [...genres]
    .filter((g) => g.count >= 1)
    .sort((a, b) => b.count * (b.avgRating ?? 5) - a.count * (a.avgRating ?? 5))
    .slice(0, 8);

  const decades = bucketize(entries, (e) => (e.game.releaseYear ? [`${Math.floor(e.game.releaseYear / 10) * 10}-е`] : []))
    .sort((a, b) => a.name.localeCompare(b.name));

  const topHours = [...entries]
    .filter((e) => e.hoursPlayed)
    .sort((a, b) => (b.hoursPlayed ?? 0) - (a.hoursPlayed ?? 0))
    .slice(0, 5);

  return {
    total: entries.length,
    byStatus,
    totalHours: Math.round(entries.reduce((s, e) => s + (e.hoursPlayed ?? 0), 0)),
    avgRating: rated.length ? Math.round((rated.reduce((s, e) => s + (e.rating ?? 0), 0) / rated.length) * 10) / 10 : null,
    completionRate: entries.length
      ? Math.round((byStatus.COMPLETED / Math.max(1, entries.length - byStatus.WANT)) * 100)
      : 0,
    ratingDistribution,
    favoriteGenres,
    genreHours: [...genres].sort((a, b) => b.hours - a.hours).filter((g) => g.hours > 0).slice(0, 8),
    platforms: bucketize(entries, platformOf),
    decades,
    topHours,
  };
}

export async function getEntries(userId: string): Promise<Entry[]> {
  return db.userGame.findMany({ where: { userId }, include: { game: true }, orderBy: { updatedAt: "desc" } });
}

// ---------- Игровой итог года ----------

const ARCHETYPES: { genre: string; title: string; text: string }[] = [
  { genre: "Хоррор", title: "Охотник за страхом", text: "Тьма — твоя стихия. Ты проходишь то, что другие выключают на первой минуте." },
  { genre: "Соулслайк", title: "Несломленный", text: "YOU DIED для тебя — не приговор, а приглашение попробовать ещё раз." },
  { genre: "RPG", title: "Хронист миров", text: "Сотни часов в чужих историях, и каждая — как прожитая жизнь." },
  { genre: "Рогалик", title: "Ещё один забег", text: "Ты знаешь, что «последний ран» — это миф. И тебя это устраивает." },
  { genre: "Стратегия", title: "Великий стратег", text: "Ты думаешь на десять ходов вперёд — даже в магазине." },
  { genre: "Метроидвания", title: "Картограф", text: "Ни одна стена не останется непроверенной." },
  { genre: "Шутер", title: "Меткий стрелок", text: "Реакция, адреналин и идеальные хедшоты." },
  { genre: "Инди", title: "Искатель жемчужин", text: "Ты находишь шедевры там, куда не смотрят крупные студии." },
  { genre: "Приключения", title: "Путешественник", text: "Главное — не финал, а дорога к нему." },
];

export async function getWrappedYears(userId: string) {
  const entries = await db.userGame.findMany({ where: { userId }, select: { completedAt: true, createdAt: true } });
  const years = new Set<number>();
  for (const e of entries) {
    if (e.completedAt) years.add(e.completedAt.getFullYear());
    years.add(e.createdAt.getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

export function computeWrapped(entries: Entry[], year: number) {
  const inYear = (d: Date | null) => d && d.getFullYear() === year;
  const completed = entries.filter((e) => e.status === "COMPLETED" && inYear(e.completedAt));
  const added = entries.filter((e) => inYear(e.createdAt));
  const active = entries.filter(
    (e) => inYear(e.completedAt) || (e.status !== "WANT" && (inYear(e.updatedAt) || inYear(e.createdAt))),
  );
  const dropped = active.filter((e) => e.status === "DROPPED");

  const hours = Math.round(active.reduce((s, e) => s + (e.hoursPlayed ?? 0), 0));
  const genres = bucketize(active, genresOf);
  const platforms = bucketize(active, platformOf);
  const topGenre = genres[0] ?? null;

  const gameOfYear =
    [...completed].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.hoursPlayed ?? 0) - (a.hoursPlayed ?? 0))[0] ??
    null;
  const longest = [...active].sort((a, b) => (b.hoursPlayed ?? 0) - (a.hoursPlayed ?? 0))[0] ?? null;

  const monthCounts = Array.from({ length: 12 }, (_, m) => completed.filter((e) => e.completedAt!.getMonth() === m).length);
  const busiestMonth = monthCounts.some(Boolean) ? monthCounts.indexOf(Math.max(...monthCounts)) : null;

  const genreNames = genres.map((g) => g.name);
  const archetype =
    ARCHETYPES.find((a) => genreNames.slice(0, 2).includes(a.genre)) ??
    ARCHETYPES.find((a) => genreNames.includes(a.genre)) ?? {
      genre: "",
      title: "Универсальный игрок",
      text: "Тебе интересно всё — и это редкий талант.",
    };

  const rated = completed.filter((e) => e.rating);
  return {
    year,
    completedCount: completed.length,
    addedCount: added.length,
    droppedCount: dropped.length,
    hours,
    avgRating: rated.length ? Math.round((rated.reduce((s, e) => s + e.rating!, 0) / rated.length) * 10) / 10 : null,
    topGenres: genres.slice(0, 5),
    topGenre,
    topPlatform: platforms[0] ?? null,
    gameOfYear,
    longest,
    busiestMonth,
    monthCounts,
    archetype,
    completed: completed.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
  };
}
