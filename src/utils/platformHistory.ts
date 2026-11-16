type Entry = { index: number; key: string; pathname: string };

// Only entries observed by this running app can authorize a browser Back.
// A history length/index or a referrer alone cannot establish that it is internal.
export function createPlatformHistory(isPlatformPath: (pathname: string) => boolean) {
  const entries = new Map<number, Entry>();
  return {
    record(entry: Entry, action: "PUSH" | "POP" | "REPLACE") {
      if (!Number.isInteger(entry.index) || entry.index < 0) return;
      if (action === "PUSH") for (const index of entries.keys()) if (index >= entry.index) entries.delete(index);
      if (isPlatformPath(entry.pathname)) entries.set(entry.index, entry);
      else entries.delete(entry.index);
    },
    canGoBack(index: number, key: string) {
      return Number.isInteger(index) && index > 0 && entries.get(index)?.key === key && entries.has(index - 1);
    },
  };
}
