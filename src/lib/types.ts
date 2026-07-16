export type BookEntry = {
  dateTop: string;
  dateBot: string;
  title: string;
  rate: string;
};

export type BookEntryRecord = {
  id: string;
  user_id: string;
  year: number;
  sort_order: number;
  date_top: string;
  date_bot: string;
  title: string;
  rate: string;
  created_at?: string;
};

export type ChatMessageRecord = {
  id: string;
  user_id: string;
  conversation_key: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  created_at?: string;
};

export type HomeState =
  | { kind: "mainCard" }
  | { kind: "shelf" }
  | { kind: "yearFocused"; year: number };

export function recordToEntry(r: BookEntryRecord): BookEntry {
  return {
    dateTop: r.date_top,
    dateBot: r.date_bot,
    title: r.title,
    rate: r.rate,
  };
}

export function pageEntries(entries: BookEntry[], size = 16): BookEntry[][] {
  if (entries.length === 0) return [[]];
  const pages: BookEntry[][] = [];
  for (let i = 0; i < entries.length; i += size) {
    pages.push(entries.slice(i, i + size));
  }
  return pages;
}

export function conversationKey(year: number, title: string): string {
  return `${year}:${title}`;
}
