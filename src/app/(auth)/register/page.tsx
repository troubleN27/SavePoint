import type { Metadata } from "next";
import { RegisterForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-bold">Новая игра</h1>
      <p className="mb-6 mt-1 text-muted">Бесплатно, до 50 игр в коллекции. Pro — когда захочешь.</p>
      <RegisterForm />
    </>
  );
}
