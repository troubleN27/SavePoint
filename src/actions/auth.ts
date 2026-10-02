"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { usernameSchema } from "@/lib/validation";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Имя — минимум 2 символа").max(40),
  username: usernameSchema,
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z.string().min(8, "Пароль — минимум 8 символов"),
});

export type AuthState = { error?: string } | undefined;

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, username, email, password } = parsed.data;

  const taken = await db.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (taken) return { error: taken.email === email ? "Этот email уже зарегистрирован" : "Этот ник уже занят" };

  await db.user.create({ data: { name, username, email, passwordHash: await bcrypt.hash(password, 10) } });
  await signIn("credentials", { email, password, redirectTo: "/library" });
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const next = String(formData.get("next") || "");
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      // Только относительные пути, чтобы не было open redirect
      redirectTo: next.startsWith("/") && !next.startsWith("//") ? next : "/library",
    });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Неверный email или пароль" };
    throw error; // NEXT_REDIRECT
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
