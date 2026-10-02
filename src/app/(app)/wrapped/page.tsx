import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/plans";
import { getWrappedYears } from "@/lib/stats";
import { ProLocked } from "@/components/ProLocked";
import { WrappedPreview } from "@/components/Wrapped";

export default async function WrappedIndex() {
  const user = await requireUser();
  if (!can(user, "wrapped")) return <ProLocked feature="wrapped" preview={<WrappedPreview />} />;
  const [latest] = await getWrappedYears(user.id);
  redirect(`/wrapped/${latest ?? new Date().getFullYear()}`);
}
