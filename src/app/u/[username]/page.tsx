import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, Gamepad2, Star, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { can } from "@/lib/plans";
import { computeStats, getEntries } from "@/lib/stats";
import { parseList } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import { GameCard, GameGrid } from "@/components/GameCard";
import { GameCover } from "@/components/GameCover";
import { LinkButton } from "@/components/ui/Button";
import { ProBadge } from "@/components/ui/Badge";

type Params = Promise<{ username: string }>;

/** Профиль виден, только если владелец на Pro и включил публичность. */
async function getPublicUser(username: string) {
  const user = await db.user.findUnique({ where: { username: username.toLowerCase() } });
  if (!user || !user.isPublic || !can(user, "publicProfile")) return null;
  return user;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const user = await getPublicUser((await params).username);
  if (!user) return { title: "Профиль не найден" };
  return { title: `${user.name} (@${user.username})`, description: user.bio ?? `Игровой дневник ${user.name} на SavePoint` };
}

export default async function PublicProfilePage({ params }: { params: Params }) {
  const user = await getPublicUser((await params).username);
  if (!user) notFound();

  const [entries, shelves] = await Promise.all([
    getEntries(user.id),
    db.shelf.findMany({
      where: { userId: user.id, isPublic: true },
      orderBy: { createdAt: "asc" },
      include: { items: { orderBy: { position: "asc" }, include: { userGame: { include: { game: true } } } } },
    }),
  ]);
  const stats = computeStats(entries);
  const recent = entries
    .filter((e) => e.status === "COMPLETED")
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
    .slice(0, 12);
  const playing = entries.filter((e) => e.status === "PLAYING").slice(0, 6);

  const toCard = (e: (typeof entries)[number]) => ({
    title: e.game.title,
    coverUrl: e.game.coverUrl,
    genres: parseList(e.game.genres),
    platform: e.platformPlayed ?? parseList(e.game.platforms)[0] ?? null,
    releaseYear: e.game.releaseYear,
    rating: e.rating,
    status: e.status,
  });

  return (
    <div className="relative min-h-dvh">
      <div className="bg-glow pointer-events-none fixed inset-0 -z-10" />
      <header className="border-b border-line bg-bg/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo />
          <LinkButton href="/register" size="sm">
            Завести свой дневник
          </LinkButton>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <section className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="grid size-24 shrink-0 place-items-center rounded-3xl border border-magenta/60 bg-magenta/10 font-display text-4xl font-black text-magenta shadow-[0_0_40px_rgba(232,121,249,0.35)]">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h1 className="font-display text-3xl font-bold">{user.name}</h1>
              <ProBadge />
            </div>
            <p className="text-muted">@{user.username}</p>
            {user.bio && <p className="mt-2 max-w-xl text-ink/90">{user.bio}</p>}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Gamepad2, label: "игр в коллекции", value: stats.total, tone: "text-cyan" },
            { icon: Trophy, label: "пройдено", value: stats.byStatus.COMPLETED, tone: "text-lime" },
            { icon: Clock, label: "часов в играх", value: stats.totalHours, tone: "text-magenta" },
            { icon: Star, label: "средняя оценка", value: stats.avgRating ?? "—", tone: "text-amber" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-surface p-4">
              <s.icon className={`size-5 ${s.tone}`} />
              <div className="mt-2 font-display text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </section>

        {stats.favoriteGenres.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-faint">Любимые жанры:</span>
            {stats.favoriteGenres.slice(0, 5).map((g) => (
              <span key={g.name} className="rounded-lg border border-cyan/30 bg-cyan/5 px-2 py-0.5 text-sm text-cyan">
                {g.name}
              </span>
            ))}
          </div>
        )}

        {playing.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-xl font-bold">Сейчас играет</h2>
            <GameGrid>
              {playing.map((e) => (
                <GameCard key={e.id} game={toCard(e)} />
              ))}
            </GameGrid>
          </section>
        )}

        {recent.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 font-display text-xl font-bold">Недавно пройдено</h2>
            <GameGrid>
              {recent.map((e) => (
                <GameCard key={e.id} game={toCard(e)} />
              ))}
            </GameGrid>
          </section>
        )}

        {shelves.length > 0 && (
          <section className="mt-12 space-y-8">
            <h2 className="font-display text-xl font-bold">Полки</h2>
            {shelves.map((s) => (
              <div key={s.id} className="rounded-2xl border border-line bg-surface p-5">
                <h3 className="font-display text-lg font-bold text-magenta">{s.name}</h3>
                {s.description && <p className="text-sm text-muted">{s.description}</p>}
                <div className="scrollbar-none mt-4 flex gap-3 overflow-x-auto pb-1">
                  {s.items.map(({ userGame: e }) => (
                    <div key={e.id} className="w-28 shrink-0">
                      <div className="overflow-hidden rounded-xl">
                        <GameCover src={e.game.coverUrl} title={e.game.title} />
                      </div>
                      <p className="mt-1.5 truncate text-xs">{e.game.title}</p>
                      {e.rating && <p className="text-xs text-cyan">{e.rating}/10</p>}
                    </div>
                  ))}
                  {!s.items.length && <p className="text-sm text-faint">Пока пусто</p>}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
