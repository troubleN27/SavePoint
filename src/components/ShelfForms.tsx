"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { createShelf, deleteShelf, toggleShelfItem, updateShelf } from "@/actions/shelves";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { GameCover } from "./GameCover";
import { cn } from "@/lib/utils";

const inputCls =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition placeholder:text-faint focus:border-cyan/60";

type ShelfValues = { name: string; description: string; isPublic: boolean };

function ShelfFields({ initial, onSubmit, submitLabel }: { initial: ShelfValues; onSubmit: (v: ShelfValues) => Promise<string | null>; submitLabel: string }) {
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => setError(await onSubmit(v)));
      }}
    >
      <input autoFocus required maxLength={60} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Например: Лучшие хорроры" className={inputCls} />
      <textarea
        maxLength={200}
        rows={2}
        value={v.description}
        onChange={(e) => setV({ ...v, description: e.target.value })}
        placeholder="Описание (необязательно)"
        className={cn(inputCls, "h-auto py-2")}
      />
      <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={v.isPublic} onChange={(e) => setV({ ...v, isPublic: e.target.checked })} className="size-4 accent-cyan" />
        Показывать в публичном профиле
      </label>
      {error && <p className="text-sm text-red">{error}</p>}
      <Button disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />} {submitLabel}
      </Button>
    </form>
  );
}

export function CreateShelf() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Новая полка
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} label="Новая полка">
        <h2 className="mb-5 font-display text-xl font-bold">Новая полка</h2>
        <ShelfFields
          initial={{ name: "", description: "", isPublic: true }}
          submitLabel="Создать"
          onSubmit={async (v) => {
            const res = await createShelf(v);
            if (!res.ok) return res.error;
            router.push(`/shelves/${res.data.id}`);
            return null;
          }}
        />
      </Modal>
    </>
  );
}

export function EditShelf({ id, initial }: { id: string; initial: ShelfValues }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="size-4" /> Изменить
      </Button>
      <Button
        variant="danger"
        disabled={pending}
        onClick={() => {
          if (!confirm("Удалить полку? Игры останутся в коллекции.")) return;
          startTransition(async () => {
            await deleteShelf(id);
            router.push("/shelves");
          });
        }}
      >
        <Trash2 className="size-4" />
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} label="Редактировать полку">
        <h2 className="mb-5 font-display text-xl font-bold">Редактировать полку</h2>
        <ShelfFields
          initial={initial}
          submitLabel="Сохранить"
          onSubmit={async (v) => {
            const res = await updateShelf(id, v);
            if (!res.ok) return res.error;
            setOpen(false);
            router.refresh();
            return null;
          }}
        />
      </Modal>
    </>
  );
}

type Candidate = { id: string; title: string; coverUrl: string | null; inShelf: boolean };

export function ShelfPicker({ shelfId, candidates }: { shelfId: string; candidates: Candidate[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState(candidates);
  const [, startTransition] = useTransition();

  const toggle = (id: string) => {
    setItems((list) => list.map((c) => (c.id === id ? { ...c, inShelf: !c.inShelf } : c)));
    startTransition(async () => {
      await toggleShelfItem(shelfId, id);
    });
  };

  const filtered = items.filter((c) => c.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <Button
        onClick={() => {
          setItems(candidates);
          setOpen(true);
        }}
      >
        <Plus className="size-4" /> Добавить игры
      </Button>
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          router.refresh();
        }}
        label="Добавить игры на полку"
        className="max-w-2xl"
      >
        <h2 className="mb-4 font-display text-xl font-bold">Игры из коллекции</h2>
        <label className="relative mb-4 block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск…" className={cn(inputCls, "pl-9")} />
        </label>
        <div className="grid max-h-[55vh] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={cn(
                "relative cursor-pointer overflow-hidden rounded-xl border-2 text-left transition",
                c.inShelf ? "border-magenta shadow-[0_0_16px_rgba(232,121,249,0.4)]" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <GameCover src={c.coverUrl} title={c.title} />
              {c.inShelf && (
                <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-magenta text-bg">
                  <Check className="size-4" />
                </span>
              )}
              <span className="block truncate bg-surface px-2 py-1.5 text-xs">{c.title}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
