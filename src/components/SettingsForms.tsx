"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { setProfilePublic, updateProfile } from "@/actions/profile";
import { useUpgrade } from "./UpgradeModal";
import { Button } from "./ui/Button";
import { cn } from "@/lib/utils";

const inputCls =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition placeholder:text-faint focus:border-cyan/60";
const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-faint";

export function ProfileForm({ initial }: { initial: { name: string; username: string; bio: string } }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await updateProfile(v);
          setMsg(res.ok ? { ok: true, text: "Сохранено" } : { ok: false, text: res.error });
          if (res.ok) router.refresh();
        });
      }}
    >
      <label>
        <span className={labelCls}>Имя</span>
        <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={inputCls} />
      </label>
      <label>
        <span className={labelCls}>Ник (для ссылки)</span>
        <div className="flex items-center rounded-xl border border-line bg-surface focus-within:border-cyan/60">
          <span className="pl-3 text-sm text-faint">/u/</span>
          <input value={v.username} onChange={(e) => setV({ ...v, username: e.target.value })} className="h-10 min-w-0 flex-1 bg-transparent pr-3 text-sm outline-none" />
        </div>
      </label>
      <label className="sm:col-span-2">
        <span className={labelCls}>О себе</span>
        <textarea
          rows={2}
          maxLength={200}
          value={v.bio}
          onChange={(e) => setV({ ...v, bio: e.target.value })}
          placeholder="Люблю соулслайки и уютные инди"
          className={cn(inputCls, "h-auto py-2")}
        />
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button disabled={pending}>{pending && <Loader2 className="size-4 animate-spin" />} Сохранить</Button>
        {msg && <span className={cn("text-sm", msg.ok ? "text-lime" : "text-red")}>{msg.text}</span>}
      </div>
    </form>
  );
}

export function PublicProfileToggle({ isPublic: initial, username }: { isPublic: boolean; username: string }) {
  const { isPro, openUpgrade } = useUpgrade();
  const [isPublic, setIsPublic] = useState(initial);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const path = `/u/${username}`;
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(location.origin), []);

  const toggle = () => {
    if (!isPro) return openUpgrade("publicProfile");
    startTransition(async () => {
      const res = await setProfilePublic(!isPublic);
      if (res.ok) setIsPublic(!isPublic);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          role="switch"
          aria-checked={isPublic}
          aria-label="Публичный профиль"
          onClick={toggle}
          disabled={pending}
          className={cn(
            "relative h-7 w-12 shrink-0 cursor-pointer rounded-full border transition",
            isPublic ? "border-cyan bg-cyan/30 shadow-[0_0_14px_rgba(34,211,238,0.4)]" : "border-line bg-surface-2",
          )}
        >
          <span className={cn("absolute top-0.5 size-5 rounded-full transition-all", isPublic ? "left-6 bg-cyan" : "left-0.5 bg-faint")} />
        </button>
        <div>
          <div className="font-medium">Публичный профиль</div>
          <div className="text-sm text-muted">Коллекция, статистика и публичные полки будут доступны по ссылке</div>
        </div>
      </div>
      {isPro && isPublic && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2/50 p-3">
          <code className="min-w-0 flex-1 truncate text-sm text-cyan">
            {origin}
            {path}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(location.origin + path);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Скопировано" : "Копировать"}
          </Button>
          <Link href={path} target="_blank" className="inline-flex h-8 items-center gap-1 px-2 text-sm text-muted hover:text-ink">
            <ExternalLink className="size-3.5" /> Открыть
          </Link>
        </div>
      )}
    </div>
  );
}
