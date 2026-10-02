import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { FREE_GAME_LIMIT, PRO_PRICES, isPro, type BillingInterval } from "@/lib/plans";
import { isBillingEnabled } from "@/lib/stripe";
import { syncSubscription } from "@/lib/billing";
import { PageHeader } from "@/components/PageHeader";
import { PlanTable } from "@/components/PlanComparison";
import { ProfileForm, PublicProfileToggle } from "@/components/SettingsForms";
import { ManageSubscriptionButton, UpgradePanel } from "@/components/Checkout";
import { ProBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Настройки" };

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-5 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

const CHECKOUT_NOTICES = {
  success: { tone: "border-lime/40 bg-lime/10 text-lime", icon: CheckCircle2, text: "Оплата прошла — Pro активирован. Приятной игры!" },
  pending: { tone: "border-amber/40 bg-amber/10 text-amber", icon: Clock, text: "Оплата обрабатывается — Pro включится в течение минуты. Обнови страницу." },
  cancelled: { tone: "border-line bg-surface-2 text-muted", icon: AlertTriangle, text: "Оплата отменена, деньги не списаны." },
} as const;

const formatDate = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/** Сверяет подписку со Stripe при открытии настроек (например, после возврата из клиентского портала). */
async function freshUser() {
  const user = await requireUser();
  if (!user.stripeSubscriptionId || !isBillingEnabled()) return user;
  try {
    await syncSubscription(user.stripeSubscriptionId);
    return (await db.user.findUnique({ where: { id: user.id } })) ?? user;
  } catch (error) {
    console.error("[billing] settings sync failed", error);
    return user;
  }
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const user = await freshUser();
  const { checkout } = await searchParams;
  const count = await db.userGame.count({ where: { userId: user.id } });
  const pro = isPro(user);
  const subscribed = Boolean(user.stripeSubscriptionId);
  const notice = CHECKOUT_NOTICES[checkout as keyof typeof CHECKOUT_NOTICES];
  const interval = user.subscriptionInterval as BillingInterval | null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Настройки" subtitle={user.email} />

      {notice && (
        <div className={cn("flex items-center gap-3 rounded-xl border px-4 py-3 text-sm", notice.tone)}>
          <notice.icon className="size-5 shrink-0" /> {notice.text}
        </div>
      )}

      <Section title="Профиль">
        <ProfileForm initial={{ name: user.name, username: user.username, bio: user.bio ?? "" }} />
      </Section>

      <Section title="Публичность">
        <PublicProfileToggle isPublic={user.isPublic} username={user.username} />
      </Section>

      <Section id="plan" title="Тариф">
        <div className="mb-6 rounded-xl border border-line bg-surface-2/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted">
                Текущий тариф: {pro ? <ProBadge /> : <span className="font-semibold text-ink">Free</span>}
              </div>
              <div className="mt-1 text-sm text-faint">
                {!pro && `Игр в коллекции: ${count} из ${FREE_GAME_LIMIT}`}
                {pro && !subscribed && "Все функции открыты (демо-аккаунт)"}
                {pro && subscribed && interval && `${PRO_PRICES[interval].label} / ${PRO_PRICES[interval].per}`}
                {pro && subscribed && user.currentPeriodEnd && (
                  <>
                    {" · "}
                    {user.cancelAtPeriodEnd ? "действует до " : "следующее списание "}
                    {formatDate(user.currentPeriodEnd)}
                  </>
                )}
              </div>
            </div>
            {subscribed && isBillingEnabled() && <ManageSubscriptionButton />}
          </div>

          {user.subscriptionStatus === "past_due" && (
            <p className="mt-3 flex items-center gap-2 text-sm text-amber">
              <AlertTriangle className="size-4" /> Не удалось списать оплату. Обнови карту в «Управлять подпиской», иначе Pro отключится.
            </p>
          )}
          {pro && subscribed && user.cancelAtPeriodEnd && (
            <p className="mt-3 text-sm text-muted">
              Подписка отменена и не продлится. Возобновить можно в «Управлять подпиской».
            </p>
          )}

          {!pro && (
            <div className="mt-5 border-t border-line pt-5">
              {isBillingEnabled() ? <UpgradePanel /> : <p className="text-sm text-muted">Оплата временно недоступна.</p>}
            </div>
          )}
        </div>
        <PlanTable />
      </Section>
    </div>
  );
}
