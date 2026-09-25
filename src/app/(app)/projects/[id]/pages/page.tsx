import { redirect } from "next/navigation";
import { requireProjectAccess } from "@/lib/auth";
import { findFirstPage } from "@/lib/data";

export default async function ProjectPagesIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProjectAccess(id);
  const first = await findFirstPage(id);
  redirect(first ? `/projects/${id}/pages/${first.id}` : `/projects/${id}`);
}
