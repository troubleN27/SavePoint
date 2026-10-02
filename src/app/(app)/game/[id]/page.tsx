import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Monitor, Tag } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPro } from "@/lib/plans";
import { parseList } from "@/lib/utils";
import { GameCover } from "@/components/GameCover";
import { EntryEditor } from "@/components/EntryEditor";
import { StatusBadge } from "@/components/ui/Badge";

type Params = Promise<{ id: string }>;

async function getEntry(id: string, userId: string) {
  return db.userGame.findFirst({ where: { id, userId }, include: { game: true, shelfItems: true } });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const user = await requireUser();
  const entry = await getEntry((await params).id, user.id);
  return { title: entry?.game.title ?? "Игра" };
}

export default async function GamePage({ params }: { params: Params }) {
  const user = await requireUser();
  const entry = await getEntry((await params).id, user.id);
  if (!entry) notFound();

  const { game } = entry;
  const genres = parseList(game.genres);
  const platforms = parseList(game.platforms);
  const shelves = isPro(user)
    ? await db.shelf.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } })
    : [];
  const inShelves = new Set(entry.shelfItems.map((s) => s.shelfId));

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/library" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-cyan">
        <ArrowLeft className="size-4" /> К коллекции
      </Link>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <div className="mx-auto w-48 md:w-full">
          <div className="overflow-hidden rounded-2xl glow-cyan">
            <GameCover src={game.coverUrl} title={game.title} />
          </div>
        </div>

        <div className="min-w-0">
          <StatusBadge status={entry.status} />
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">{game.title}</h1>
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {genres.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="size-4 text-magenta" />
                <dt className="sr-only">Жанр</dt>
                <dd>{genres.join(", ")}</dd>
              </div>
            )}
            {platforms.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Monitor className="size-4 text-cyan" />
                <dt className="sr-only">Платформы</dt>
                <dd>{platforms.join(", ")}</dd>
              </div>
            )}
            {game.releaseYear && (
              <div className="flex items-center gap-1.5">
                <Calendar className="size-4 text-lime" />
                <dt className="sr-only">Год выхода</dt>
                <dd>{game.releaseYear}</dd>
              </div>
            )}
          </dl>

          <div className="neon-border mt-8 rounded-2xl p-5 sm:p-6">
            <EntryEditor
              entry={{
                id: entry.id,
                status: entry.status,
                rating: entry.rating,
                review: entry.review,
                hoursPlayed: entry.hoursPlayed,
                platformPlayed: entry.platformPlayed,
                completedAt: entry.completedAt?.toISOString() ?? null,
              }}
              platforms={platforms}
              shelves={shelves.map((s) => ({ id: s.id, name: s.name, has: inShelves.has(s.id) }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
