import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProjectPagesIndex({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const first = await prisma.page.findFirst({
    where: { projectId: id },
    orderBy: { name: "asc" },
    select: { id: true },
  });
  redirect(first ? `/projects/${id}/pages/${first.id}` : `/projects/${id}`);
}
