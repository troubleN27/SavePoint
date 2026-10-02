import type { Metadata } from "next";
import { Clock, Gamepad2, Star, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/plans";
import { computeStats, getEntries } from "@/lib/stats";
import { STATUSES, STATUS_META } from "@/lib/constants";
import { pluralize } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { ProLocked } from "@/components/ProLocked";
import { HBarChart, RatingChart } from "@/components/StatsCharts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Статистика" };

const STATUS_DOT: Record<string, string> = {
  PLAYING: "bg-cyan",
  COMPLETED: "bg-lime",
  WANT: "bg-violet",
  DROPPED: "bg-red",
};

export default async function StatsPage() {
  const user = await requireUser();
  if (!can(user, "stats")) return <ProLocked feature="stats" preview={<StatsPreview />} />;

  const stats = computeStats(await getEntries(user.id));

  return (
    <>
      <PageHeader title="Статистика" subtitle="Твоя игровая жизнь в цифрах" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile icon={Gamepad2} label="Игр в коллекции" value={stats.total} tone="text-cyan" />
        <Tile icon={Trophy} label="Пройдено" value={stats.byStatus.COMPLETED} tone="text-lime" sub={`${stats.completionRate}% начатых`} />
        <Tile
          icon={Clock}
          label="Часов в играх"
          value={stats.totalHours}
          tone="text-magenta"
          sub={`≈ ${Math.round(stats.totalHours / 24)} ${pluralize(Math.round(stats.totalHours / 24), ["день", "дня", "дней"])}`}
        />
        <Tile icon={Star} label="Средняя оценка" value={stats.avgRating ?? "—"} tone="text-amber" />
      </div>

      <Card title="Статусы" className="mt-4">
        <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
          {STATUSES.map((s) =>
            stats.byStatus[s] ? (
              <div key={s} className={STATUS_DOT[s]} style={{ flexGrow: stats.byStatus[s] }} title={`${STATUS_META[s].label}: ${stats.byStatus[s]}`} />
            ) : null,
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {STATUSES.map((s) => (
            <span key={s} className="inline-flex items-center gap-2 text-muted">
              <span className={cn("size-2.5 rounded-full", STATUS_DOT[s])} />
              {STATUS_META[s].label} <span className="text-ink">{stats.byStatus[s]}</span>
            </span>
          ))}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Любимые жанры" subtitle="С учётом количества игр и средней оценки">
          <HBarChart
            color="#22d3ee"
            unit="игр"
            data={stats.favoriteGenres.map((g) => ({ name: g.name, value: g.count, hint: g.avgRating ? `ср. оценка ${g.avgRating}` : undefined }))}
          />
        </Card>
        <Card title="Платформы" subtitle="Где ты играешь">
          <HBarChart
            color="#a3e635"
            unit="игр"
            data={stats.platforms.slice(0, 8).map((p) => ({ name: p.name, value: p.count, hint: `${p.hours} ч` }))}
          />
        </Card>
        <Card title="Часы по жанрам">
          <HBarChart color="#a78bfa" unit="ч" data={stats.genreHours.map((g) => ({ name: g.name, value: g.hours }))} />
        </Card>
        <Card title="Распределение оценок">
          <RatingChart data={stats.ratingDistribution} />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Больше всего часов">
          <ol className="space-y-3">
            {stats.topHours.map((e, i) => (
              <li key={e.id} className="flex items-center gap-3">
                <span className="w-6 font-display text-sm text-faint">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{e.game.title}</span>
                <span className="font-display text-sm text-magenta">{Math.round(e.hoursPlayed ?? 0)} ч</span>
              </li>
            ))}
            {!stats.topHours.length && <p className="text-sm text-faint">Укажи часы в карточках игр</p>}
          </ol>
        </Card>
        <Card title="По десятилетиям выхода">
          <HBarChart color="#fbbf24" unit="игр" data={stats.decades.map((d) => ({ name: d.name, value: d.count }))} />
        </Card>
      </div>
    </>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <Icon className={cn("size-5", tone)} />
      <div className="mt-3 font-display text-2xl font-bold sm:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
      {sub && <div className="text-xs text-faint">{sub}</div>}
    </div>
  );
}

function Card({ title, subtitle, className, children }: { title: string; subtitle?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface p-5", className)}>
      <h2 className="font-display text-base font-bold">{title}</h2>
      {subtitle && <p className="text-xs text-faint">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatsPreview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[128, 64, 1840, 8.4].map((v, i) => (
          <div key={i} className="h-28 rounded-2xl border border-line bg-surface p-5 font-display text-3xl">
            {v}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3 rounded-2xl border border-line bg-surface p-5">
            {[90, 70, 55, 40, 25].map((w) => (
              <div key={w} className="h-4 rounded bg-cyan/60" style={{ width: `${w}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
