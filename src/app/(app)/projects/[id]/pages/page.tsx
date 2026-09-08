import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { findFirstPage } from "@/lib/data";

export default async function ProjectPagesIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const first = await findFirstPage(id);
  redirect(first ? `/projects/${id}/pages/${first.id}` : `/projects/${id}`);
}
