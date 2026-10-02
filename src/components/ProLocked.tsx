"use client";

import { useEffect } from "react";
import { Lock, Sparkles } from "lucide-react";
import { useUpgrade } from "./UpgradeModal";
import { Button } from "./ui/Button";
import { ProBadge } from "./ui/Badge";
import { PRO_FEATURES, type ProFeature } from "@/lib/plans";

/** Заглушка Pro-страницы для Free: размытое превью + окно с предложением Pro. */
export function ProLocked({ feature, preview }: { feature: ProFeature; preview?: React.ReactNode }) {
  const { openUpgrade } = useUpgrade();

  useEffect(() => {
    openUpgrade(feature);
  }, [feature, openUpgrade]);

  return (
    <div className="relative min-h-[70vh] overflow-hidden rounded-3xl border border-line">
      <div aria-hidden className="pointer-events-none select-none p-6 opacity-40 blur-[6px]">
        {preview}
      </div>
      <div className="absolute inset-0 grid place-items-center bg-bg/40 p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 grid size-16 place-items-center rounded-2xl border border-magenta/50 bg-magenta/10 shadow-[0_0_30px_rgba(232,121,249,0.35)]">
            <Lock className="size-7 text-magenta" />
          </div>
          <ProBadge />
          <h1 className="mt-3 font-display text-2xl font-bold">{PRO_FEATURES[feature].title}</h1>
          <p className="mt-2 text-muted">{PRO_FEATURES[feature].description}</p>
          <Button variant="pro" size="lg" className="mt-6" onClick={() => openUpgrade(feature)}>
            <Sparkles className="size-4" /> Открыть с Pro
          </Button>
        </div>
      </div>
    </div>
  );
}
