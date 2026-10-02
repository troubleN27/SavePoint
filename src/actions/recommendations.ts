"use server";

import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/plans";
import { getRecommendations, type RecommendationResult } from "@/lib/recommendations";
import type { ActionResult } from "./types";

export async function refreshRecommendations(): Promise<ActionResult<RecommendationResult>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "AUTH", error: "Нужно войти" };
  if (!can(user, "ai")) return { ok: false, code: "PRO_REQUIRED", error: "AI-рекомендации доступны на Pro" };
  return { ok: true, data: await getRecommendations(user.id, { refresh: true }) };
}
