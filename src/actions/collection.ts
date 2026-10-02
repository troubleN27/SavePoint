"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { FREE_GAME_LIMIT, gameLimit, reviewMax } from "@/lib/plans";
import { STATUSES, isStatus } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import type { ActionError, ActionResult } from "./types";

const AUTH_ERROR: ActionError = { ok: false, code: "AUTH", error: "Нужно войти" };

async function limitError(userId: string, plan: string): Promise<ActionError | null> {
  const count = await db.userGame.count({ where: { userId } });
  if (count < gameLimit({ plan })) return null;
  return {
    ok: false,
    code: "LIMIT",
    error: `На тарифе Free можно хранить до ${FREE_GAME_LIMIT} игр. Перейди на Pro, чтобы снять ограничение.`,
  };
}

export async function addToCollection(gameId: string, status = "WANT"): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return AUTH_ERROR;
  if (!isStatus(status)) return { ok: false, code: "VALIDATION", error: "Неверный статус" };

  const existing = await db.userGame.findUnique({ where: { userId_gameId: { userId: user.id, gameId } } });
  if (existing) return { ok: true, data: { id: existing.id } };

  const limit = await limitError(user.id, user.plan);
  if (limit) return limit;

  const game = await db.game.findUnique({ where: { id: gameId } });
  if (!game) return { ok: false, error: "Игра не найдена" };

  const entry = await db.userGame.create({
    data: { userId: user.id, gameId, status, completedAt: status === "COMPLETED" ? new Date() : null },
  });
  revalidatePath("/library");
  return { ok: true, data: { id: entry.id } };
}

const optionalText = (max: number) => z.string().trim().max(max).optional();
const emptyToUndefined = z.literal("").transform(() => undefined);

const customGameSchema = z.object({
  title: z.string().trim().min(1, "Укажи название").max(120),
  genre: optionalText(80),
  platform: optionalText(40),
  year: z.coerce.number().int().min(1950, "Некорректный год").max(2100, "Некорректный год").optional().or(emptyToUndefined),
  coverUrl: z.string().trim().url("Некорректная ссылка на обложку").optional().or(emptyToUndefined),
});

export async function addCustomGame(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return AUTH_ERROR;
  const parsed = customGameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, code: "VALIDATION", error: parsed.error.issues[0].message };

  const limit = await limitError(user.id, user.plan);
  if (limit) return limit;

  const { title, genre, platform, year, coverUrl } = parsed.data;
  const genres = (genre ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const game = await db.game.create({
    data: {
      title,
      slug: `${slugify(title) || "game"}-${Date.now().toString(36)}`,
      genres: JSON.stringify(genres),
      platforms: JSON.stringify(platform ? [platform] : []),
      releaseYear: year ?? null,
      coverUrl: coverUrl ?? null,
    },
  });
  const entry = await db.userGame.create({
    data: { userId: user.id, gameId: game.id, status: "WANT", platformPlayed: platform || null },
  });
  revalidatePath("/library");
  return { ok: true, data: { id: entry.id } };
}

const updateSchema = z.object({
  status: z.enum(STATUSES),
  rating: z.number().int().min(1).max(10).nullable(),
  review: z.string().trim().nullable(),
  hoursPlayed: z.number().min(0).max(100000).nullable(),
  platformPlayed: z.string().trim().max(40).nullable(),
  completedAt: z.string().nullable(),
});

export type EntryUpdate = z.input<typeof updateSchema>;

export async function updateEntry(id: string, input: EntryUpdate): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return AUTH_ERROR;
  const entry = await db.userGame.findFirst({ where: { id, userId: user.id } });
  if (!entry) return { ok: false, error: "Запись не найдена" };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION", error: parsed.error.issues[0].message };
  const d = parsed.data;

  const max = reviewMax(user);
  if (d.review && d.review.length > max) {
    return user.plan === "PRO"
      ? { ok: false, code: "VALIDATION", error: `Отзыв длиннее ${max} символов` }
      : { ok: false, code: "PRO_REQUIRED", error: `На Free отзыв до ${max} символов. Подробные отзывы — на Pro.` };
  }

  let completedAt = d.completedAt ? new Date(d.completedAt) : null;
  if (d.status === "COMPLETED" && !completedAt) completedAt = entry.completedAt ?? new Date();
  if (d.status !== "COMPLETED") completedAt = null;

  await db.userGame.update({
    where: { id },
    data: {
      status: d.status,
      rating: d.rating,
      review: d.review || null,
      hoursPlayed: d.hoursPlayed,
      platformPlayed: d.platformPlayed || null,
      completedAt,
    },
  });
  revalidatePath("/library");
  revalidatePath(`/game/${id}`);
  return { ok: true };
}

export async function quickSetStatus(id: string, status: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return AUTH_ERROR;
  if (!isStatus(status)) return { ok: false, code: "VALIDATION", error: "Неверный статус" };
  const entry = await db.userGame.findFirst({ where: { id, userId: user.id } });
  if (!entry) return { ok: false, error: "Запись не найдена" };
  await db.userGame.update({
    where: { id },
    data: { status, completedAt: status === "COMPLETED" ? (entry.completedAt ?? new Date()) : null },
  });
  revalidatePath("/library");
  return { ok: true };
}

export async function removeEntry(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return AUTH_ERROR;
  await db.userGame.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/library");
  return { ok: true };
}
