import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { hasRawg } from "@/lib/rawg";
import { searchCatalog } from "@/actions/catalog";
import { PageHeader } from "@/components/PageHeader";
import { AddGame } from "@/components/AddGame";

export const metadata: Metadata = { title: "Добавить игру" };

export default async function AddGamePage() {
  await requireUser();
  const { games } = await searchCatalog("");
  return (
    <>
      <PageHeader title="Добавить игру" subtitle="Найди игру и выбери статус: играю, прошёл, хочу пройти или бросил." />
      <AddGame rawgEnabled={hasRawg()} initial={games} />
    </>
  );
}
