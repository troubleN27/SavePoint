"use client";

import { createContext, useCallback, useContext, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Bot, Check, Infinity as InfinityIcon, Library, Sparkles, UserRound } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { ProBadge } from "./ui/Badge";
import { PRO_FEATURES, type ProFeature } from "@/lib/plans";
import { changePlan } from "@/actions/profile";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const featured: ProFeature = reason && reason !== "review" ? reason : "unlimited";
  const FeaturedIcon = ICONS[featured];

  const upgrade = () =>
    startTransition(async () => {
      const res = await changePlan("PRO");
      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    });

  const close = () => {
    setDone(false);
    onClose();
  };

  return (
    <Modal open={reason !== null} onClose={close} label="Переход на Pro">
      {done ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-lime/50 bg-lime/10 shadow-[0_0_30px_rgba(163,230,53,0.35)]">
            <Check className="size-8 text-lime" />
          </div>
          <h2 className="font-display text-2xl font-bold">Pro активирован!</h2>
          <p className="mt-2 text-muted">Все функции открыты. Приятной игры!</p>
          <Button className="mt-6" onClick={close}>
            Продолжить
          </Button>
        </div>
      ) : (
        <>
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

          <ul className="mt-6 space-y-2.5">
            {(Object.keys(PRO_FEATURES) as ProFeature[]).map((f) => {
              const Icon = ICONS[f];
              return (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Icon className={f === featured ? "mt-0.5 size-4 shrink-0 text-magenta" : "mt-0.5 size-4 shrink-0 text-cyan"} />
                  <span>
                    <span className="font-medium text-ink">{PRO_FEATURES[f].title}</span>
                    <span className="text-muted"> — {PRO_FEATURES[f].description}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row">
            <Button variant="pro" size="lg" className="flex-1" onClick={upgrade} disabled={pending}>
              <Sparkles className="size-4" />
              {pending ? "Активируем…" : "Перейти на Pro"}
            </Button>
            <Button variant="ghost" size="lg" onClick={close}>
              Позже
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-faint">
            Оплата пока не подключена — Pro включается бесплатно в демо-режиме.{" "}
            <Link href="/settings#plan" onClick={close} className="underline hover:text-muted">
              Подробнее о тарифах
            </Link>
          </p>
        </>
      )}
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
