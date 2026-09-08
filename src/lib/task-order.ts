import { prisma } from "@/lib/prisma";

export async function loadSortOrders(projectId: string) {
  const rows = await prisma.$queryRaw<{ id: string; sortOrder: number }[]>`
    SELECT id, sortOrder FROM qa_page_task WHERE projectId = ${projectId}
  `;
  return new Map(rows.map((row) => [row.id, Number(row.sortOrder) || 0]));
}

export async function nextSortOrderAtTop(projectId: string, status: string) {
  const rows = await prisma.$queryRaw<{ minOrder: number | null }[]>`
    SELECT MIN(sortOrder) AS minOrder
    FROM qa_page_task
    WHERE projectId = ${projectId} AND status = ${status}
  `;
  return (rows[0]?.minOrder ?? 1) - 1;
}

export async function writeTaskSortOrder(id: string, sortOrder: number, status?: string) {
  if (status) {
    await prisma.$executeRaw`
      UPDATE qa_page_task
      SET sortOrder = ${sortOrder}, status = ${status}
      WHERE id = ${id}
    `;
    return;
  }
  await prisma.$executeRaw`
    UPDATE qa_page_task SET sortOrder = ${sortOrder} WHERE id = ${id}
  `;
}
