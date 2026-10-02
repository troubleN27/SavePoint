import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/plans";
import { computeWrapped, getEntries, getWrappedYears } from "@/lib/stats";
import { parseList } from "@/lib/utils";
import { ProLocked } from "@/components/ProLocked";
import { Wrapped, WrappedPreview, type WrappedData } from "@/components/Wrapped";

type Params = Promise<{ year: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  return { title: `Итог ${(await params).year} года` };
}

export default async function WrappedPage({ params }: { params: Params }) {
  const user = await requireUser();
  if (!can(user, "wrapped")) return <ProLocked feature="wrapped" preview={<WrappedPreview />} />;

  const year = Number((await params).year);
  if (!Number.isInteger(year) || year < 1970 || year > 2100) notFound();

  const [entries, years] = await Promise.all([getEntries(user.id), getWrappedYears(user.id)]);
  const w = computeWrapped(entries, year);

  const pick = (e: (typeof w)["gameOfYear"]) =>
    e && {
      title: e.game.title,
      coverUrl: e.game.coverUrl,
      rating: e.rating,
      hours: e.hoursPlayed ? Math.round(e.hoursPlayed) : null,
      genres: parseList(e.game.genres),
      review: e.review,
    };

  const data: WrappedData = {
    year,
    years: years.includes(year) ? years : [year, ...years].sort((a, b) => b - a),
    name: user.name,
    username: user.username,
    isPublic: user.isPublic,
    completedCount: w.completedCount,
    addedCount: w.addedCount,
    droppedCount: w.droppedCount,
    hours: w.hours,
    avgRating: w.avgRating,
    topGenres: w.topGenres.map((g) => ({ name: g.name, count: g.count })),
    topPlatform: w.topPlatform && { name: w.topPlatform.name, count: w.topPlatform.count, hours: w.topPlatform.hours },
    gameOfYear: pick(w.gameOfYear),
    longest: pick(w.longest),
    busiestMonth: w.busiestMonth,
    monthCounts: w.monthCounts,
    archetype: { title: w.archetype.title, text: w.archetype.text },
    covers: w.completed.slice(0, 12).map((e) => ({ title: e.game.title, coverUrl: e.game.coverUrl })),
  };

  return <Wrapped data={data} />;
}
