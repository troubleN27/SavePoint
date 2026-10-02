import Link from "next/link";
import {
  BarChart3,
  Bot,
  Check,
  Filter,
  Gamepad2,
  Library,
  Lock,
  PenLine,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { FREE_GAME_LIMIT, REVIEW_MAX } from "@/lib/plans";
import { SEED_GAMES } from "@/lib/catalog-seed";
import { Logo } from "@/components/Logo";
import { LinkButton } from "@/components/ui/Button";
import { ProBadge } from "@/components/ui/Badge";
import { GameCover } from "@/components/GameCover";
import { PlanTable, PRO_PRICE } from "@/components/PlanComparison";
import { cn } from "@/lib/utils";

const HERO_GAMES = ["elden-ring", "hollow-knight", "baldurs-gate-3", "silent-hill-2", "hades", "cyberpunk-2077", "disco-elysium", "celeste", "outer-wilds"]
  .map((slug) => SEED_GAMES.find((g) => g.slug === slug)!)
  .filter(Boolean);

const HERO_META: Record<string, { rating: number; status: string; color: string }> = {
  "elden-ring": { rating: 10, status: "Прошёл", color: "text-lime border-lime/40" },
  "hollow-knight": { rating: 10, status: "Прошёл", color: "text-lime border-lime/40" },
  "baldurs-gate-3": { rating: 9, status: "Играю", color: "text-cyan border-cyan/40" },
  "silent-hill-2": { rating: 9, status: "Прошёл", color: "text-lime border-lime/40" },
  hades: { rating: 9, status: "Играю", color: "text-cyan border-cyan/40" },
  "cyberpunk-2077": { rating: 8, status: "Прошёл", color: "text-lime border-lime/40" },
};

const FEATURES = [
  { icon: Gamepad2, title: "Коллекция игр", text: "Обложка, жанр, платформа и год выхода — вся библиотека в одном месте, с поиском по большой базе игр." },
  { icon: Check, title: "Статусы", text: "Играю, прошёл, хочу пройти, бросил — всегда понятно, что дальше." },
  { icon: Star, title: "Оценки 1–10", text: "Оценивай по десятибалльной шкале и сортируй коллекцию по любимым играм." },
  { icon: PenLine, title: "Отзывы", text: "Короткие впечатления или подробные рецензии — твой личный игровой дневник." },
  { icon: Filter, title: "Поиск и фильтры", text: "Находи нужное по статусу, жанру и оценке за пару кликов." },
  { icon: BarChart3, title: "Статистика", text: "Любимые жанры, платформы и часы в играх — наглядно и красиво.", pro: true },
  { icon: Sparkles, title: "Игровой итог года", text: "Твой год в играх в стиле Wrapped: игра года, архетип, главные цифры.", pro: true },
  { icon: Bot, title: "AI-рекомендации", text: "Нейросеть анализирует оценки и отзывы и подсказывает, что пройти следующим.", pro: true },
  { icon: Library, title: "Свои полки", text: "«Лучшие хорроры», «Пройти с другом» — собирай подборки на любой вкус.", pro: true },
  { icon: UserRound, title: "Публичный профиль", text: "Делись коллекцией и полками по личной ссылке.", pro: true },
];

const FAQ = [
  { q: "Это правда бесплатно?", a: `Да. На Free можно вести коллекцию до ${FREE_GAME_LIMIT} игр, ставить оценки, статусы и писать короткие отзывы — без ограничения по времени.` },
  { q: "Что будет с моими играми, если я вернусь с Pro на Free?", a: "Ничего не пропадёт: коллекция, оценки и отзывы сохранятся. Просто Pro-функции станут недоступны, а публичный профиль скроется." },
  { q: "Откуда берутся обложки и данные об играх?", a: "Из большой открытой базы игр. Если нужной игры там нет, её можно добавить вручную." },
  { q: "Как работают AI-рекомендации?", a: "Нейросеть смотрит на твои оценки, отзывы и брошенные игры и предлагает то, что с наибольшей вероятностью тебе зайдёт, — с объяснением почему." },
  { q: "Как оплатить Pro?", a: "Сейчас SavePoint в раннем доступе: Pro включается бесплатно в демо-режиме прямо в настройках." },
];

export default async function Landing() {
  const user = await getCurrentUser();
  const cta = user ? { href: "/library", label: "В мою коллекцию" } : { href: "/register", label: "Начать бесплатно" };

  return (
    <div className="relative overflow-x-clip">
      <div className="bg-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]" />
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            <a href="#features" className="hover:text-ink">Возможности</a>
            <a href="#wrapped" className="hover:text-ink">Итог года</a>
            <a href="#pricing" className="hover:text-ink">Тарифы</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {!user && (
              <LinkButton href="/login" variant="ghost" size="sm">
                Войти
              </LinkButton>
            )}
            <LinkButton href={cta.href} size="sm">
              {user ? "Коллекция" : "Начать"}
            </LinkButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-red/40 bg-red/5 px-3 py-1 text-xs text-red">
            <span className="size-1.5 animate-pulse-glow rounded-full bg-red shadow-[0_0_8px_#ff2800]" />
            Дневник геймера
          </span>
          <h1 className="mt-6 font-display text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
            Каждая игра —<br />
            <span className="text-neon-cyan">точка</span> <span className="text-neon-magenta">сохранения</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            SavePoint хранит историю твоих игр: что прошёл, что бросил и что ждёт своей очереди. Ставь оценки, пиши отзывы,
            смотри статистику и получай игровой итог года.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={cta.href} size="lg">
              <Gamepad2 className="size-5" /> {cta.label}
            </LinkButton>
            <LinkButton href="#pricing" variant="outline" size="lg">
              Сравнить тарифы
            </LinkButton>
          </div>
          <p className="mt-4 text-sm text-faint">Без карты · до {FREE_GAME_LIMIT} игр бесплатно</p>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
          <div className="absolute -inset-8 -z-10 rounded-full bg-gradient-to-tr from-magenta/25 via-red/15 to-cyan/25 blur-3xl" />
          <div className="grid grid-cols-3 gap-3 [transform:perspective(1200px)_rotateY(-12deg)_rotateX(6deg)]">
            {HERO_GAMES.map((g, i) => {
              const meta = HERO_META[g.slug];
              return (
                <div
                  key={g.slug}
                  className={cn(
                    "relative overflow-hidden rounded-xl border border-line shadow-2xl",
                    i % 3 === 1 && "translate-y-6",
                    i === 0 && "glow-cyan",
                    i === 4 && "glow-magenta",
                    i === 3 && "glow-red",
                  )}
                >
                  <GameCover src={g.coverUrl} title={g.title} />
                  {meta && (
                    <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between">
                      <span className={cn("rounded-md border bg-bg/80 px-1.5 py-0.5 text-[10px] backdrop-blur", meta.color)}>{meta.status}</span>
                      <span className="rounded-md border border-cyan/40 bg-bg/80 px-1.5 py-0.5 font-display text-[11px] font-bold text-cyan backdrop-blur">
                        {meta.rating}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-line/60 bg-surface/30 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Всё для твоей игровой истории</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted">Базовые функции бесплатны навсегда. Pro открывает аналитику, AI и социальные фишки.</p>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={cn(
                  "group rounded-2xl border bg-surface p-6 transition hover:-translate-y-1",
                  f.pro ? "border-magenta/25 hover:border-magenta/60 hover:shadow-[0_10px_40px_-12px_rgba(232,121,249,0.5)]" : "border-line hover:border-cyan/50 hover:shadow-[0_10px_40px_-12px_rgba(34,211,238,0.5)]",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className={cn("grid size-11 place-items-center rounded-xl border", f.pro ? "border-magenta/40 bg-magenta/10 text-magenta" : "border-cyan/40 bg-cyan/10 text-cyan")}>
                    <f.icon className="size-5" />
                  </div>
                  {f.pro && <ProBadge />}
                </div>
                <h3 className="mt-5 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wrapped teaser */}
      <section id="wrapped" className="scroll-mt-20 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
          <div>
            <ProBadge />
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
              Твой год в играх — <span className="text-gradient">как никогда раньше</span>
            </h2>
            <p className="mt-4 text-lg text-muted">
              В конце года SavePoint соберёт твой личный итог: сколько игр пройдено, сколько часов наиграно, любимый жанр и
              платформа, игра года и твой игровой архетип. Поделись им с друзьями!
            </p>
            <ul className="mt-6 space-y-2 text-muted">
              {["Анимированные слайды в стиле Wrapped", "Игра года по твоим оценкам", "Активность по месяцам", "Игровой архетип: «Несломленный», «Хронист миров»…"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <Check className="size-4 text-magenta" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-red/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-red/55 via-magenta/35 to-bg p-8 shadow-2xl">
              <div className="bg-grid absolute inset-0 opacity-40" />
              <div className="relative">
                <div className="flex gap-1">
                  {[1, 1, 1, 0, 0, 0].map((on, i) => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full", on ? "bg-ink" : "bg-ink/25")} />
                  ))}
                </div>
                <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">В этом году ты прошёл</p>
                <div className="mt-3 font-display text-8xl font-black text-neon-cyan">42</div>
                <p className="text-2xl font-semibold">игры</p>
                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-ink/70">Твой жанр года</p>
                <p className="mt-1 font-display text-3xl font-black">Соулслайк</p>
                <p className="mt-8 text-sm text-ink/80">Архетип: «Несломленный» 🗡️</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 border-t border-line/60 bg-surface/30 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center font-display text-3xl font-bold sm:text-4xl">Тарифы</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-muted">Начни бесплатно. Переходи на Pro, когда коллекция вырастет.</p>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-3xl border border-line bg-surface p-7">
              <h3 className="font-display text-xl font-bold">Free</h3>
              <p className="mt-1 text-sm text-muted">Для старта и небольших коллекций</p>
              <div className="mt-6 font-display text-4xl font-black">
                0 ₽<span className="text-base font-normal text-muted"> / навсегда</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {[`До ${FREE_GAME_LIMIT} игр в коллекции`, "Статусы: играю, прошёл, хочу пройти, бросил", "Оценки от 1 до 10", `Короткие отзывы до ${REVIEW_MAX.FREE} символов`, "Поиск и фильтры"].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-cyan" /> {t}
                  </li>
                ))}
                {["Статистика и итог года", "AI-рекомендации", "Полки и публичный профиль"].map((t) => (
                  <li key={t} className="flex gap-2.5 text-faint">
                    <Lock className="mt-0.5 size-4 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
              <LinkButton href={cta.href} variant="outline" size="lg" className="mt-8">
                {user ? "Открыть коллекцию" : "Начать бесплатно"}
              </LinkButton>
            </div>

            <div className="relative flex flex-col rounded-3xl p-7 neon-border shadow-[0_0_60px_-15px_rgba(232,121,249,0.55)]">
              <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-magenta to-violet px-3 py-1 text-xs font-bold text-bg shadow-[0_0_20px_rgba(232,121,249,0.6)]">
                Популярный
              </span>
              <h3 className="font-display text-xl font-bold text-neon-magenta">Pro</h3>
              <p className="mt-1 text-sm text-muted">Для тех, кто играет всерьёз</p>
              <div className="mt-6 font-display text-4xl font-black">
                {PRO_PRICE}
                <span className="text-base font-normal text-muted"> / месяц</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {[
                  "Безлимитная коллекция",
                  "Всё из Free + подробные отзывы",
                  "Статистика: любимые жанры, платформы, часы",
                  "Игровой итог года в стиле Wrapped",
                  "AI-рекомендации, что пройти следующим",
                  "Свои списки и полки",
                  "Публичный профиль со ссылкой",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-magenta" /> {t}
                  </li>
                ))}
              </ul>
              <LinkButton href={user ? "/settings#plan" : "/register"} variant="pro" size="lg" className="mt-8">
                <Sparkles className="size-4" /> Попробовать Pro
              </LinkButton>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="mb-4 text-center font-display text-lg font-bold">Подробное сравнение</h3>
            <PlanTable />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-center font-display text-3xl font-bold">Вопросы и ответы</h2>
          <div className="mt-10 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-surface p-5 open:border-cyan/40">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {f.q}
                  <span className="text-xl text-cyan transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-cyan/20 via-magenta/15 to-red/25 px-6 py-14 text-center">
          <div className="bg-grid absolute inset-0 opacity-50" />
          <div className="relative">
            <h2 className="font-display text-3xl font-black sm:text-4xl">Нажми Start</h2>
            <p className="mx-auto mt-3 max-w-lg text-ink/80">Создай дневник за минуту и добавь первые игры — прогресс сохранится автоматически.</p>
            <LinkButton href={cta.href} size="lg" className="mt-8">
              <Gamepad2 className="size-5" /> {cta.label}
            </LinkButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-line/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-faint sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} SavePoint. Дневник геймера.</p>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-ink">Вход</Link>
            <a href="#pricing" className="hover:text-ink">Тарифы</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
