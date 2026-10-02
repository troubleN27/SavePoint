import type { Metadata } from "next";
import Link from "next/link";
import { Globe, Lock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/plans";
import { pluralize } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { ProLocked } from "@/components/ProLocked";
import { GameCover } from "@/components/GameCover";
import { CreateShelf } from "@/components/ShelfForms";

export const metadata: Metadata = { title: "Полки" };

export default async function ShelvesPage() {
  const user = await requireUser();
  if (!can(user, "shelves")) {
    return (
      <ProLocked
        feature="shelves"
        preview={
          <div className="grid grid-cols-3 gap-4">
            {["Лучшие хорроры", "Уютные игры", "Шедевры 10/10"].map((n) => (
              <div key={n} className="h-48 rounded-2xl border border-line bg-surface p-5 font-display text-xl">
                {n}
              </div>
            ))}
          </div>
        }
      />
    );
  }

  const shelves = await db.shelf.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { items: { orderBy: { position: "asc" }, take: 4, include: { userGame: { include: { game: true } } } }, _count: { select: { items: true } } },
  });

  return (
    <>
      <PageHeader title="Мои полки" subtitle="Собирай свои подборки: «Лучшие хорроры», «Игры на вечер», «Пройти с другом»…" actions={<CreateShelf />} />
      {shelves.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">
          Пока нет ни одной полки — создай первую!
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shelves.map((s) => (
            <Link
              key={s.id}
              href={`/shelves/${s.id}`}
              className="group rounded-2xl border border-line bg-surface p-5 transition hover:-translate-y-1 hover:border-magenta/50 hover:shadow-[0_8px_30px_-6px_rgba(232,121,249,0.35)]"
            >
              <div className="flex h-28 items-end">
                {s.items.length ? (
                  s.items.map((it, i) => (
                    <div
                      key={it.id}
                      className="w-20 overflow-hidden rounded-lg border-2 border-surface shadow-lg transition group-hover:translate-y-[-4px]"
                      style={{ marginLeft: i ? -28 : 0, transform: `rotate(${(i - 1.5) * 4}deg)`, zIndex: 4 - i }}
                    >
                      <GameCover src={it.userGame.game.coverUrl} title={it.userGame.game.title} />
                    </div>
                  ))
                ) : (
                  <div className="grid h-full w-full place-items-center rounded-xl border border-dashed border-line text-sm text-faint">пусто</div>
                )}
              </div>
              <div className="mt-5 flex items-center gap-2">
                <h2 className="min-w-0 flex-1 truncate font-display text-lg font-bold group-hover:text-magenta">{s.name}</h2>
                {s.isPublic ? <Globe className="size-4 text-faint" aria-label="Публичная" /> : <Lock className="size-4 text-faint" aria-label="Приватная" />}
              </div>
              {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{s.description}</p>}
              <p className="mt-2 text-xs text-faint">
                {s._count.items} {pluralize(s._count.items, ["игра", "игры", "игр"])}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
