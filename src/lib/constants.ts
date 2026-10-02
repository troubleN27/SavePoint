export const STATUSES = ["PLAYING", "COMPLETED", "WANT", "DROPPED"] as const;
export type GameStatus = (typeof STATUSES)[number];

export const STATUS_META: Record<GameStatus, { label: string; short: string; color: string }> = {
  PLAYING: { label: "Играю", short: "Играю", color: "cyan" },
  COMPLETED: { label: "Прошёл", short: "Прошёл", color: "lime" },
  WANT: { label: "Хочу пройти", short: "Хочу", color: "violet" },
  DROPPED: { label: "Бросил", short: "Бросил", color: "red" },
};

export function isStatus(v: unknown): v is GameStatus {
  return typeof v === "string" && (STATUSES as readonly string[]).includes(v);
}

export const PLANS = ["FREE", "PRO"] as const;
export type Plan = (typeof PLANS)[number];
