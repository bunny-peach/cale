"use client";

export const KEYS = {
  apiConfig: "cale_api_config",
  systemPrompt: "cale_system_prompt",
  conversations: "cale_conversations",
  currentConversation: "cale_current_conversation",
  diary: "cale_diary",
  memories: "cale_memories",
  wishlist: "cale_mcp_wishlist",
  periodData: "cale_period_data",
  usageStats: "cale_usage_stats",
  settings: "cale_settings",
  moods: "cale_moods",
  stickers: "cale_stickers",
  playlist: "cale_playlist",
  bookshelf: "cale_bookshelf",
} as const;

export function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / serialization errors
  }
}

export function remove(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
