import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo } from "@/components/Logo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/library");
  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="bg-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="neon-border rounded-3xl p-6 shadow-[0_0_60px_-20px_rgba(34,211,238,0.4)] sm:p-8">{children}</div>
      </div>
    </div>
  );
}
