import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) throw new CredentialsSignin();
        const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
          throw new CredentialsSignin();
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
  },
});

/** Текущий пользователь из БД (тариф читается свежим, а не из JWT). */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return db.user.findUnique({ where: { id } });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
