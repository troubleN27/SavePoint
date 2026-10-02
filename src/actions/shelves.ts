"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/plans";
import type { ActionError, ActionResult } from "./types";

const AUTH_ERROR: ActionError = { ok: false, code: "AUTH", error: "Нужно войти" };
const PRO_ERROR: ActionError = { ok: false, code: "PRO_REQUIRED", error: "Полки доступны на тарифе Pro" };

const shelfSchema = z.object({
  name: z.string().trim().min(1, "Назови полку").max(60),
  description: z.string().trim().max(200).optional(),
  isPublic: z.boolean().optional(),
});
type ShelfInput = z.input<typeof shelfSchema>;

async function proUser(): Promise<{ id: string } | ActionError> {
  const user = await getCurrentUser();
  if (!user) return AUTH_ERROR;
  if (!can(user, "shelves")) return PRO_ERROR;
  return user;
}

export async function createShelf(input: ShelfInput): Promise<ActionResult<{ id: string }>> {
  const user = await proUser();
  if ("ok" in user) return user;
  const parsed = shelfSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION", error: parsed.error.issues[0].message };
  const shelf = await db.shelf.create({
    data: {
      userId: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      isPublic: parsed.data.isPublic ?? true,
    },
  });
  revalidatePath("/shelves");
  return { ok: true, data: { id: shelf.id } };
}

export async function updateShelf(id: string, input: ShelfInput): Promise<ActionResult> {
  const user = await proUser();
  if ("ok" in user) return user;
  const parsed = shelfSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION", error: parsed.error.issues[0].message };
  await db.shelf.updateMany({
    where: { id, userId: user.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      isPublic: parsed.data.isPublic ?? true,
    },
  });
  revalidatePath(`/shelves/${id}`);
  revalidatePath("/shelves");
  return { ok: true };
}

export async function deleteShelf(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return AUTH_ERROR;
  await db.shelf.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/shelves");
  return { ok: true };
}

export async function toggleShelfItem(shelfId: string, userGameId: string): Promise<ActionResult<{ added: boolean }>> {
  const user = await proUser();
  if ("ok" in user) return user;
  const [shelf, entry] = await Promise.all([
    db.shelf.findFirst({ where: { id: shelfId, userId: user.id } }),
    db.userGame.findFirst({ where: { id: userGameId, userId: user.id } }),
  ]);
  if (!shelf || !entry) return { ok: false, error: "Не найдено" };

  const existing = await db.shelfItem.findUnique({ where: { shelfId_userGameId: { shelfId, userGameId } } });
  if (existing) {
    await db.shelfItem.delete({ where: { id: existing.id } });
  } else {
    const count = await db.shelfItem.count({ where: { shelfId } });
    await db.shelfItem.create({ data: { shelfId, userGameId, position: count } });
  }
  revalidatePath(`/shelves/${shelfId}`);
  revalidatePath(`/game/${userGameId}`);
  return { ok: true, data: { added: !existing } };
}
