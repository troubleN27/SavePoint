"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const AXIS = { stroke: "#5d5d80", fontSize: 12 };
const GRID = "#23233b";

type Row = { name: string; value: number; hint?: string };

function ChartTooltip({ active, payload, unit }: { active?: boolean; payload?: { payload: Row }[]; unit: string }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs shadow-xl">
      <div className="font-medium text-ink">{row.name}</div>
      <div className="text-muted">
        {row.value} {unit}
        {row.hint && <span className="text-faint"> · {row.hint}</span>}
      </div>
    </div>
  );
}

/** Горизонтальные столбцы: одна серия, одна неоновая заливка, тултип по наведению. */
export function HBarChart({ data, color, unit }: { data: Row[]; color: string; unit: string }) {
  if (!data.length) return <Empty />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={110} tick={{ ...AXIS, fill: "#8f8fb3" }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip unit={unit} />} />
        <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} maxBarSize={20} style={{ filter: `drop-shadow(0 0 6px ${color}66)` }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Распределение оценок 1–10. */
export function RatingChart({ data }: { data: { rating: number; count: number }[] }) {
  if (!data.some((d) => d.count)) return <Empty />;
  const rows = data.map((d) => ({ name: `Оценка ${d.rating}`, short: String(d.rating), value: d.count }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={rows} margin={{ left: -16, right: 8, top: 8, bottom: 0 }} barCategoryGap={4}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="short" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} />
        <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip unit="игр" />} />
        <Bar dataKey="value" fill="#e879f9" radius={[4, 4, 0, 0]} style={{ filter: "drop-shadow(0 0 6px #e879f966)" }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Empty() {
  return <p className="py-10 text-center text-sm text-faint">Пока недостаточно данных</p>;
}
