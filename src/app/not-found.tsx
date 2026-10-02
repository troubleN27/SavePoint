import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-display text-sm uppercase tracking-[0.3em] text-neon-red">Game Over</p>
        <h1 className="mt-4 font-display text-7xl font-black text-neon-cyan">404</h1>
        <p className="mt-4 text-muted">Такой страницы нет — или профиль скрыт владельцем.</p>
        <LinkButton href="/" className="mt-8">
          Вернуться к сохранению
        </LinkButton>
      </div>
    </div>
  );
}
