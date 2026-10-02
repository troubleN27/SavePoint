import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/plans";
import { getRecommendations } from "@/lib/recommendations";
import { PageHeader } from "@/components/PageHeader";
import { ProLocked } from "@/components/ProLocked";
import { Recommendations } from "@/components/Recommendations";

export const metadata: Metadata = { title: "Рекомендации" };

export default async function RecommendationsPage() {
  const user = await requireUser();
  if (!can(user, "ai")) {
    return (
      <ProLocked
        feature="ai"
        preview={
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-cyan/30 to-magenta/30" />
            ))}
          </div>
        }
      />
    );
  }

  const initial = await getRecommendations(user.id);
  return (
    <>
      <PageHeader title="Что пройти дальше" subtitle="Подборка на основе твоих оценок, отзывов и брошенных игр" />
      <Recommendations initial={initial} />
    </>
  );
}
