"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { openBillingPortal, startCheckout } from "@/actions/billing";
import { BILLING_INTERVALS, PRO_PRICES, YEARLY_DISCOUNT, type BillingInterval } from "@/lib/plans";
import { cn } from "@/lib/utils";
import { Button } from "./ui/Button";

/** Переключатель «месяц / год» с ценами. */
export function IntervalPicker({ value, onChange }: { value: BillingInterval; onChange: (v: BillingInterval) => void }) {
  return (
    <div role="radiogroup" aria-label="Период оплаты" className="grid grid-cols-2 gap-2">
      {BILLING_INTERVALS.map((i) => {
        const p = PRO_PRICES[i];
        const active = value === i;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(i)}
            className={cn(
              "relative cursor-pointer rounded-xl border p-3 text-left transition",
              active ? "border-magenta/70 bg-magenta/10 shadow-[0_0_18px_rgba(232,121,249,0.25)]" : "border-line bg-surface hover:border-faint",
            )}
          >
            {i === "year" && (
              <span className="absolute -top-2.5 right-2 rounded-full bg-red px-2 py-0.5 text-[10px] font-bold text-bg">{YEARLY_DISCOUNT}</span>
            )}
            <div className="text-xs text-muted">{i === "month" ? "Помесячно" : "За год"}</div>
            <div className="font-display text-lg font-bold">
              {p.label}
              <span className="text-xs font-normal text-muted"> / {p.per}</span>
            </div>
            {i === "year" && <div className="text-[11px] text-faint">≈ {p.perMonth} в месяц</div>}
          </button>
        );
      })}
    </div>
  );
}

/** Кнопка оформления подписки: создаёт сессию Stripe Checkout и уходит на страницу оплаты. */
export function CheckoutButton({ interval, className }: { interval: BillingInterval; className?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const p = PRO_PRICES[interval];

  return (
    <div className={className}>
      <Button
        variant="pro"
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await startCheckout(interval);
            if (res.ok) window.location.assign(res.data.url);
            else setError(res.error);
          })
        }
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {pending ? "Переходим к оплате…" : `Оформить Pro за ${p.label} / ${p.per}`}
      </Button>
      {error && <p className="mt-2 text-center text-sm text-red">{error}</p>}
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-faint">
        <Lock className="size-3" /> Безопасная оплата через Stripe · отмена в любой момент
      </p>
    </div>
  );
}

/** Выбор периода + оформление подписки (страница настроек). */
export function UpgradePanel() {
  const [interval, setBillingInterval] = useState<BillingInterval>("year");
  return (
    <div className="max-w-md">
      <IntervalPicker value={interval} onChange={setBillingInterval} />
      <CheckoutButton interval={interval} className="mt-4" />
    </div>
  );
}

/** Кнопка перехода в клиентский портал Stripe. */
export function ManageSubscriptionButton() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await openBillingPortal();
            if (res.ok) window.location.assign(res.data.url);
            else setError(res.error);
          })
        }
      >
        {pending && <Loader2 className="size-4 animate-spin" />} Управлять подпиской
      </Button>
      {error && <p className="mt-2 text-sm text-red">{error}</p>}
    </div>
  );
}
