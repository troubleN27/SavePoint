import type { Plan } from "./constants";

/** Единый источник лимитов и доступа к функциям тарифов. */
export const FREE_GAME_LIMIT = 50;
export const REVIEW_MAX: Record<Plan, number> = { FREE: 500, PRO: 5000 };

export const BILLING_INTERVALS = ["month", "year"] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

/** Цены Pro; должны совпадать с ценами в Stripe (scripts/stripe-setup.ts). */
export const PRO_PRICES: Record<BillingInterval, { amount: number; label: string; per: string; perMonth: string }> = {
  month: { amount: 499, label: "$4.99", per: "месяц", perMonth: "$4.99" },
  year: { amount: 3999, label: "$39.99", per: "год", perMonth: "$3.33" },
};
export const YEARLY_DISCOUNT = "−33%";

export type ProFeature = "unlimited" | "stats" | "wrapped" | "ai" | "shelves" | "publicProfile";

export const PRO_FEATURES: Record<ProFeature, { title: string; description: string }> = {
  unlimited: { title: "Безлимитная коллекция", description: "Добавляй сколько угодно игр — без потолка в 50 штук." },
  stats: { title: "Подробная статистика", description: "Любимые жанры, платформы, часы в играх и распределение оценок." },
  wrapped: { title: "Игровой итог года", description: "Твой год в играх в стиле Wrapped — с главными цифрами и игрой года." },
  ai: { title: "AI-рекомендации", description: "Что пройти следующим — на основе твоих оценок и отзывов." },
  shelves: { title: "Свои списки и полки", description: "Собирай подборки вроде «Лучшие хорроры» или «Уютные игры»." },
  publicProfile: { title: "Публичный профиль", description: "Делись коллекцией и полками по личной ссылке." },
};

export function isPro(user: { plan: string } | null | undefined): boolean {
  return user?.plan === "PRO";
}

export function can(user: { plan: string } | null | undefined, feature: ProFeature): boolean {
  // Сейчас все Pro-функции открываются одним тарифом; точка расширения для будущих тарифов.
  return feature in PRO_FEATURES && isPro(user);
}

export function gameLimit(user: { plan: string }): number {
  return isPro(user) ? Infinity : FREE_GAME_LIMIT;
}

export function reviewMax(user: { plan: string }): number {
  return isPro(user) ? REVIEW_MAX.PRO : REVIEW_MAX.FREE;
}
