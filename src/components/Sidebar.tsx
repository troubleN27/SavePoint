"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Gamepad2, Library, LogOut, Plus, Settings, Sparkles, UserRound } from "lucide-react";
import { Logo } from "./Logo";
import { ProLink, useUpgrade } from "./UpgradeModal";
import { ProBadge } from "./ui/Badge";
import { cn } from "@/lib/utils";
import { FREE_GAME_LIMIT, type ProFeature } from "@/lib/plans";
import { logout } from "@/actions/auth";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; pro?: ProFeature };

const NAV: NavItem[] = [
  { href: "/library", label: "Коллекция", icon: Gamepad2 },
  { href: "/library/add", label: "Добавить игру", icon: Plus },
  { href: "/stats", label: "Статистика", icon: BarChart3, pro: "stats" },
  { href: "/wrapped", label: "Итог года", icon: Sparkles, pro: "wrapped" },
  { href: "/recommendations", label: "Рекомендации", icon: Bot, pro: "ai" },
  { href: "/shelves", label: "Полки", icon: Library, pro: "shelves" },
];

type Props = { name: string; username: string; plan: string; gameCount: number; isPublic: boolean };

function isActive(pathname: string, href: string) {
  if (href === "/library") return pathname === "/library";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, pathname, compact }: { item: NavItem; pathname: string; compact?: boolean }) {
  const { isPro } = useUpgrade();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  const className = cn(
    "group flex items-center gap-3 rounded-xl text-sm font-medium transition",
    compact ? "shrink-0 px-3 py-2" : "px-3 py-2.5",
    active
      ? "bg-cyan/10 text-cyan shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]"
      : "text-muted hover:bg-surface-2 hover:text-ink",
  );
  const content = (
    <>
      <Icon className={cn("size-[18px] shrink-0", active && "drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]")} />
      <span>{item.label}</span>
      {item.pro && !isPro && <ProBadge className="ml-auto" />}
    </>
  );
  return item.pro ? (
    <ProLink href={item.href} feature={item.pro} className={className}>
      {content}
    </ProLink>
  ) : (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

export function Sidebar({ name, username, plan, gameCount, isPublic }: Props) {
  const pathname = usePathname();
  const { isPro, openUpgrade } = useUpgrade();
  const usage = Math.min(100, (gameCount / FREE_GAME_LIMIT) * 100);

  return (
    <>
      {/* Десктоп */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/70 p-4 backdrop-blur lg:flex">
        <Logo href="/library" className="px-2 py-2" />
        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
          <ProLink
            href={`/u/${username}`}
            feature="publicProfile"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <UserRound className="size-[18px]" />
            <span>Мой профиль</span>
            {!isPro && <ProBadge className="ml-auto" />}
            {isPro && !isPublic && <span className="ml-auto text-[10px] text-faint">скрыт</span>}
          </ProLink>
        </nav>

        <div className="mt-auto space-y-3">
          {!isPro && (
            <div className="rounded-xl border border-line bg-surface-2/60 p-3">
              <div className="flex justify-between text-xs text-muted">
                <span>Коллекция</span>
                <span className={cn(gameCount >= FREE_GAME_LIMIT && "text-red")}>
                  {gameCount}/{FREE_GAME_LIMIT}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                <div
                  className={cn("h-full rounded-full", usage >= 90 ? "bg-red" : "bg-cyan")}
                  style={{ width: `${usage}%` }}
                />
              </div>
              <button
                onClick={() => openUpgrade("unlimited")}
                className="mt-3 w-full cursor-pointer rounded-lg bg-gradient-to-r from-magenta to-violet py-2 text-xs font-semibold text-bg shadow-[0_0_16px_rgba(232,121,249,0.4)] transition hover:shadow-[0_0_24px_rgba(232,121,249,0.6)]"
              >
                Перейти на Pro
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="grid size-9 shrink-0 place-items-center rounded-full border border-magenta/50 bg-magenta/10 font-display text-sm font-bold text-magenta">
              {name.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="text-xs text-muted">{plan === "PRO" ? <ProBadge /> : "Free"}</div>
            </div>
            <Link href="/settings" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Настройки">
              <Settings className="size-4" />
            </Link>
            <form action={logout}>
              <button className="cursor-pointer rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-red" aria-label="Выйти">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Мобильная шапка */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo href="/library" />
          <div className="flex items-center gap-1">
            {!isPro && (
              <button
                onClick={() => openUpgrade("unlimited")}
                className="mr-1 cursor-pointer rounded-lg bg-gradient-to-r from-magenta to-violet px-2.5 py-1.5 text-xs font-semibold text-bg"
              >
                Pro
              </button>
            )}
            <Link href="/settings" className="rounded-lg p-2 text-muted hover:text-ink" aria-label="Настройки">
              <Settings className="size-5" />
            </Link>
          </div>
        </div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-3">
          {NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} compact />
          ))}
        </nav>
      </header>
    </>
  );
}
