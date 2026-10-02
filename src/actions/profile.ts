"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/plans";
import { usernameSchema } from "@/lib/validation";
import type { ActionResult } from "./types";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Имя — минимум 2 символа").max(40),
  username: usernameSchema,
  bio: z.string().trim().max(200, "Описание — до 200 символов").optional(),
});

export async function updateProfile(input: z.input<typeof profileSchema>): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "AUTH", error: "Нужно войти" };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION", error: parsed.error.issues[0].message };
  const taken = await db.user.findFirst({ where: { username: parsed.data.username, NOT: { id: user.id } } });
  if (taken) return { ok: false, code: "VALIDATION", error: "Этот ник уже занят" };
  await db.user.update({ where: { id: user.id }, data: { ...parsed.data, bio: parsed.data.bio || null } });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setProfilePublic(isPublic: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, code: "AUTH", error: "Нужно войти" };
  if (isPublic && !can(user, "publicProfile")) {
    return { ok: false, code: "PRO_REQUIRED", error: "Публичный профиль доступен на тарифе Pro" };
  }
  await db.user.update({ where: { id: user.id }, data: { isPublic } });
  revalidatePath("/settings");
  return { ok: true };
}
