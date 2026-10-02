import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { FREE_GAME_LIMIT, isPro } from "@/lib/plans";
import { PageHeader } from "@/components/PageHeader";
import { PlanTable, PRO_PRICE } from "@/components/PlanComparison";
import { PlanSwitcher, ProfileForm, PublicProfileToggle } from "@/components/SettingsForms";
import { ProBadge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Настройки" };

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="mb-5 font-display text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const count = await db.userGame.count({ where: { userId: user.id } });
  const pro = isPro(user);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Настройки" subtitle={user.email} />

      <Section title="Профиль">
        <ProfileForm initial={{ name: user.name, username: user.username, bio: user.bio ?? "" }} />
      </Section>

      <Section title="Публичность">
        <PublicProfileToggle isPublic={user.isPublic} username={user.username} />
      </Section>

      <Section id="plan" title="Тариф">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface-2/50 p-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted">
              Текущий тариф: {pro ? <ProBadge /> : <span className="font-semibold text-ink">Free</span>}
            </div>
            <div className="mt-1 text-sm text-faint">
              {pro ? "Все функции открыты" : `Игр в коллекции: ${count} из ${FREE_GAME_LIMIT}`}
              {!pro && ` · Pro — ${PRO_PRICE}/мес`}
            </div>
          </div>
          <PlanSwitcher plan={user.plan} />
        </div>
        <PlanTable />
        <p className="mt-4 text-xs text-faint">Оплата пока не подключена: Pro включается в демо-режиме без списания средств.</p>
      </Section>
    </div>
  );
}
