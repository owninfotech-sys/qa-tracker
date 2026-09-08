export function uniquePageNames(names: string[]) {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const raw of names) {
    const name = raw.trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    unique.push(name);
  }

  return unique;
}
