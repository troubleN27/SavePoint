import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPro } from "@/lib/plans";
import { Sidebar } from "@/components/Sidebar";
import { UpgradeProvider } from "@/components/UpgradeModal";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const gameCount = await db.userGame.count({ where: { userId: user.id } });

  return (
    <UpgradeProvider isPro={isPro(user)}>
      <div className="relative min-h-dvh lg:flex">
        <div className="bg-glow pointer-events-none fixed inset-0 -z-10" />
        <Sidebar name={user.name} username={user.username} plan={user.plan} gameCount={gameCount} isPublic={user.isPublic} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </UpgradeProvider>
  );
}
