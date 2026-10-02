"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Link from "next/link";
import { BarChart3, Bot, Infinity as InfinityIcon, Library, Sparkles, UserRound } from "lucide-react";
import { Modal } from "./ui/Modal";
import { ProBadge } from "./ui/Badge";
import { PRO_FEATURES, type BillingInterval, type ProFeature } from "@/lib/plans";
import { CheckoutButton, IntervalPicker } from "./Checkout";

const ICONS: Record<ProFeature, React.ComponentType<{ className?: string }>> = {
  unlimited: InfinityIcon,
  stats: BarChart3,
  wrapped: Sparkles,
  ai: Bot,
  shelves: Library,
  publicProfile: UserRound,
};

type Reason = ProFeature | "review";

type Ctx = { isPro: boolean; openUpgrade: (reason?: Reason) => void };
const UpgradeContext = createContext<Ctx>({ isPro: false, openUpgrade: () => {} });

export const useUpgrade = () => useContext(UpgradeContext);

export function UpgradeProvider({ isPro, children }: { isPro: boolean; children: React.ReactNode }) {
  const [reason, setReason] = useState<Reason | null>(null);
  const openUpgrade = useCallback((r: Reason = "unlimited") => setReason(r), []);

  return (
    <UpgradeContext.Provider value={{ isPro, openUpgrade }}>
      {children}
      <UpgradeModal reason={reason} onClose={() => setReason(null)} />
    </UpgradeContext.Provider>
  );
}

const HEADLINES: Record<Reason, string> = {
  unlimited: "Коллекция заполнена",
  stats: "Статистика — это Pro",
  wrapped: "Итог года — это Pro",
  ai: "AI-рекомендации — это Pro",
  shelves: "Полки — это Pro",
  publicProfile: "Публичный профиль — это Pro",
  review: "Подробные отзывы — это Pro",
};

export function UpgradeModal({ reason, onClose }: { reason: Reason | null; onClose: () => void }) {
  const [interval, setBillingInterval] = useState<BillingInterval>("year");
  const featured: ProFeature = reason && reason !== "review" ? reason : "unlimited";
  const FeaturedIcon = ICONS[featured];

  return (
    <Modal open={reason !== null} onClose={onClose} label="Переход на Pro">
      <div className="mb-5 flex items-center gap-3">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl border border-magenta/50 bg-magenta/10 shadow-[0_0_24px_rgba(232,121,249,0.35)]">
          <FeaturedIcon className="size-6 text-magenta" />
        </div>
        <div>
          <ProBadge />
          <h2 className="mt-1 font-display text-xl font-bold leading-tight">{reason ? HEADLINES[reason] : ""}</h2>
        </div>
      </div>
      <p className="text-muted">
        {reason === "review"
          ? "На тарифе Free отзыв ограничен 500 символами. С Pro можно писать подробные рецензии до 5000 символов."
          : reason === "unlimited"
            ? "На тарифе Free в коллекции может быть до 50 игр. С Pro — без ограничений."
            : PRO_FEATURES[featured].description}
      </p>

      <ul className="mt-5 space-y-2">
        {(Object.keys(PRO_FEATURES) as ProFeature[]).map((f) => {
          const Icon = ICONS[f];
          return (
            <li key={f} className="flex items-start gap-3 text-sm">
              <Icon className={f === featured ? "mt-0.5 size-4 shrink-0 text-magenta" : "mt-0.5 size-4 shrink-0 text-cyan"} />
              <span className="font-medium text-ink">{PRO_FEATURES[f].title}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-6">
        <IntervalPicker value={interval} onChange={setBillingInterval} />
      </div>
      <CheckoutButton interval={interval} className="mt-4" />
      <p className="mt-2 text-center text-xs text-faint">
        <Link href="/settings#plan" onClick={onClose} className="underline hover:text-muted">
          Сравнить тарифы
        </Link>
      </p>
    </Modal>
  );
}

/** Ссылка на Pro-раздел: на Free вместо перехода открывает окно с предложением Pro. */
export function ProLink({
  href,
  feature,
  className,
  children,
  onNavigate,
}: {
  href: string;
  feature: ProFeature;
  className?: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const { isPro, openUpgrade } = useUpgrade();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (!isPro) {
          e.preventDefault();
          openUpgrade(feature);
        } else onNavigate?.();
      }}
    >
      {children}
    </Link>
  );
}
