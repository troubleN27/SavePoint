import { Check, Minus } from "lucide-react";
import { FREE_GAME_LIMIT, REVIEW_MAX } from "@/lib/plans";
import { cn } from "@/lib/utils";

export const PRO_PRICE = "299 ₽";

type Row = { label: string; free: string | boolean; pro: string | boolean };

export const PLAN_ROWS: Row[] = [
  { label: "Игр в коллекции", free: `до ${FREE_GAME_LIMIT}`, pro: "без лимита" },
  { label: "Статусы: играю, прошёл, хочу, бросил", free: true, pro: true },
  { label: "Оценки от 1 до 10", free: true, pro: true },
  { label: "Отзывы", free: `до ${REVIEW_MAX.FREE} символов`, pro: `до ${REVIEW_MAX.PRO} символов` },
  { label: "Поиск и фильтры", free: true, pro: true },
  { label: "Статистика: жанры, платформы, часы", free: false, pro: true },
  { label: "Игровой итог года (Wrapped)", free: false, pro: true },
  { label: "AI-рекомендации", free: false, pro: true },
  { label: "Свои списки и полки", free: false, pro: true },
  { label: "Публичный профиль со ссылкой", free: false, pro: true },
];

function Cell({ value, pro }: { value: string | boolean; pro?: boolean }) {
  if (value === true) return <Check className={cn("mx-auto size-5", pro ? "text-magenta drop-shadow-[0_0_6px_rgba(232,121,249,0.8)]" : "text-cyan")} />;
  if (value === false) return <Minus className="mx-auto size-5 text-faint" />;
  return <span className={cn("text-sm", pro ? "font-semibold text-ink" : "text-muted")}>{value}</span>;
}

export function PlanTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-line bg-surface-2/60 text-sm">
            <th className="p-3 font-medium text-muted sm:p-4">Возможность</th>
            <th className="w-24 p-3 text-center font-display sm:w-36 sm:p-4">Free</th>
            <th className="w-24 bg-magenta/5 p-3 text-center font-display text-magenta sm:w-36 sm:p-4">Pro</th>
          </tr>
        </thead>
        <tbody>
          {PLAN_ROWS.map((r) => (
            <tr key={r.label} className="border-b border-line/60 last:border-0">
              <td className="p-3 text-sm sm:p-4">{r.label}</td>
              <td className="p-3 text-center sm:p-4">
                <Cell value={r.free} />
              </td>
              <td className="bg-magenta/5 p-3 text-center sm:p-4">
                <Cell value={r.pro} pro />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
