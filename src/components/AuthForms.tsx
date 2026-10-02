"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { login, register } from "@/actions/auth";
import { Button } from "./ui/Button";

const inputCls =
  "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm outline-none transition placeholder:text-faint focus:border-cyan/60 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]";
const labelCls = "mb-1.5 block text-sm text-muted";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className={labelCls}>Email</span>
        <input name="email" type="email" required autoComplete="email" className={inputCls} />
      </label>
      <label className="block">
        <span className={labelCls}>Пароль</span>
        <input name="password" type="password" required autoComplete="current-password" className={inputCls} />
      </label>
      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      <Button size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />} Войти
      </Button>
      <p className="text-center text-sm text-muted">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-cyan hover:underline">
          Регистрация
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCls}>Имя</span>
          <input name="name" required minLength={2} maxLength={40} autoComplete="nickname" className={inputCls} />
        </label>
        <label className="block">
          <span className={labelCls}>Ник</span>
          <input name="username" required pattern="[a-zA-Z0-9_]{3,24}" title="3–24 символа: латиница, цифры, _" className={inputCls} />
        </label>
      </div>
      <label className="block">
        <span className={labelCls}>Email</span>
        <input name="email" type="email" required autoComplete="email" className={inputCls} />
      </label>
      <label className="block">
        <span className={labelCls}>Пароль</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
      </label>
      {state?.error && <p className="text-sm text-red">{state.error}</p>}
      <Button size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />} Создать аккаунт
      </Button>
      <p className="text-center text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="text-cyan hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
