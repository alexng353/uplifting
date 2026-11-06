/** Case-insensitive; every word of the query must appear somewhere in the name. */
export function matchesSearch(name: string, query: string): boolean {
  const hay = name.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}
