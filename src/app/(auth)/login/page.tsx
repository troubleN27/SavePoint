import type { Metadata } from "next";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="font-display text-2xl font-bold">С возвращением!</h1>
      <p className="mb-6 mt-1 text-muted">Продолжим с последней точки сохранения.</p>
      <LoginForm next={next} />
    </>
  );
}
