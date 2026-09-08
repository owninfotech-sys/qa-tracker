import { mkdir, writeFile } from "fs/promises";
import path from "path";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_BYTES = 10 * 1024 * 1024;

export type SavedUpload = {
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
};

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 120) || "file";
}

export function isAllowedUpload(file: File) {
  const name = file.name.toLowerCase();
  if (file.size <= 0 || file.size > MAX_BYTES) return false;
  if (IMAGE_TYPES.has(file.type) || name.match(/\.(png|jpe?g|gif|webp)$/)) return true;
  if (file.type === DOCX_TYPE || name.endsWith(".docx")) return true;
  return false;
}

export async function saveTaskUploads(taskId: string, files: File[]) {
  const saved: SavedUpload[] = [];
  const dir = path.join(process.cwd(), "public", "uploads", "tasks", taskId);
  await mkdir(dir, { recursive: true });

  for (const file of files) {
    if (!isAllowedUpload(file)) continue;
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fileName = file.name.trim() || "file";
    const diskName = `${stamp}-${safeName(fileName)}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, diskName), bytes);
    saved.push({
      fileName,
      mimeType: file.type || (fileName.toLowerCase().endsWith(".docx") ? DOCX_TYPE : "application/octet-stream"),
      size: file.size,
      path: `/uploads/tasks/${taskId}/${diskName}`,
    });
  }

  return saved;
}

