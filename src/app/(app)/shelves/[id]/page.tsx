import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/plans";
import { parseList, pluralize } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { ProLocked } from "@/components/ProLocked";
import { GameCard, GameGrid } from "@/components/GameCard";
import { EditShelf, ShelfPicker } from "@/components/ShelfForms";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Полка" };

export default async function ShelfPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "shelves")) return <ProLocked feature="shelves" />;

  const shelf = await db.shelf.findFirst({
    where: { id: (await params).id, userId: user.id },
    include: { items: { orderBy: { position: "asc" }, include: { userGame: { include: { game: true } } } } },
  });
  if (!shelf) notFound();

  const library = await db.userGame.findMany({ where: { userId: user.id }, include: { game: true }, orderBy: { game: { title: "asc" } } });
  const inShelf = new Set(shelf.items.map((i) => i.userGameId));

  return (
    <>
      <Link href="/shelves" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-cyan">
        <ArrowLeft className="size-4" /> Все полки
      </Link>
      <PageHeader
        title={shelf.name}
        subtitle={
          <>
            {shelf.description && <span className="block">{shelf.description}</span>}
            <span className="mt-2 inline-flex items-center gap-2 text-sm">
              {shelf.items.length} {pluralize(shelf.items.length, ["игра", "игры", "игр"])}
              <Badge tone={shelf.isPublic ? "cyan" : "muted"}>{shelf.isPublic ? "публичная" : "приватная"}</Badge>
            </span>
          </>
        }
        actions={
          <>
            <ShelfPicker
              shelfId={shelf.id}
              candidates={library.map((e) => ({ id: e.id, title: e.game.title, coverUrl: e.game.coverUrl, inShelf: inShelf.has(e.id) }))}
            />
            <EditShelf id={shelf.id} initial={{ name: shelf.name, description: shelf.description ?? "", isPublic: shelf.isPublic }} />
          </>
        }
      />
      {shelf.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">На полке пока пусто — добавь игры из коллекции.</div>
      ) : (
        <GameGrid>
          {shelf.items.map(({ userGame: e }) => (
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
              }}
            />
          ))}
        </GameGrid>
      )}
    </>
  );
}
