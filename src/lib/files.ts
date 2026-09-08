export function isImageFile(fileName: string, mimeType: string) {
  return mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(fileName);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
