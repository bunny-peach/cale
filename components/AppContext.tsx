"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { KEYS, load, save, uid, todayKey } from "@/lib/storage";
import {
  ApiConfig,
  Conversation,
  DiaryEntry,
  Memory,
  WishItem,
  PeriodData,
  UsageStats,
  Settings,
  MoodEntry,
  Mood,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_SETTINGS,
  DEFAULT_PERIOD_DATA,
} from "@/lib/types";

interface AppState {
  hydrated: boolean;

  apiConfig: ApiConfig;
  setApiConfig: (c: ApiConfig) => void;

  systemPrompt: string;
  setSystemPrompt: (s: string) => void;

  conversations: Conversation[];
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  currentId: string | null;
  setCurrentId: (id: string | null) => void;

  diary: DiaryEntry[];
  setDiary: React.Dispatch<React.SetStateAction<DiaryEntry[]>>;

  memories: Memory[];
  setMemories: React.Dispatch<React.SetStateAction<Memory[]>>;

  wishlist: WishItem[];
  setWishlist: React.Dispatch<React.SetStateAction<WishItem[]>>;

  periodData: PeriodData;
  setPeriodData: (p: PeriodData) => void;

  usageStats: UsageStats;
  setUsageStats: React.Dispatch<React.SetStateAction<UsageStats>>;

  settings: Settings;
  setSettings: (s: Settings) => void;

  moods: MoodEntry[];
  setMoods: React.Dispatch<React.SetStateAction<MoodEntry[]>>;

  playlist: string[];
  setPlaylist: React.Dispatch<React.SetStateAction<string[]>>;
  bookshelf: string[];
  setBookshelf: React.Dispatch<React.SetStateAction<string[]>>;

  // helpers
  addWish: (title: string, source: WishItem["source"], description?: string) => void;
  recordUsage: (input: number, output: number) => void;
  setTodayMoodNote: (note: string) => void;
  todayMood?: MoodEntry;
}

const AppCtx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

const DEFAULT_API: ApiConfig = {
  baseURL: "",
  apiKey: "",
  model: "",
  format: "anthropic",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  const [apiConfig, setApiConfigState] = useState<ApiConfig>(DEFAULT_API);
  const [systemPrompt, setSystemPromptState] = useState<string>(
    DEFAULT_SYSTEM_PROMPT
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentIdState] = useState<string | null>(null);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [periodData, setPeriodDataState] =
    useState<PeriodData>(DEFAULT_PERIOD_DATA);
  const [usageStats, setUsageStats] = useState<UsageStats>({ days: {} });
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [bookshelf, setBookshelf] = useState<string[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setApiConfigState(load(KEYS.apiConfig, DEFAULT_API));
    setSystemPromptState(load(KEYS.systemPrompt, DEFAULT_SYSTEM_PROMPT));
    setConversations(load(KEYS.conversations, []));
    setCurrentIdState(load<string | null>(KEYS.currentConversation, null));
    setDiary(load(KEYS.diary, []));
    setMemories(load(KEYS.memories, []));
    setWishlist(load(KEYS.wishlist, []));
    setPeriodDataState(load(KEYS.periodData, DEFAULT_PERIOD_DATA));
    setUsageStats(load(KEYS.usageStats, { days: {} }));
    setSettingsState(load(KEYS.settings, DEFAULT_SETTINGS));
    setMoods(load(KEYS.moods, []));
    setPlaylist(load("cale_playlist", []));
    setBookshelf(load("cale_bookshelf", []));
    setHydrated(true);
  }, []);

  // Persist wrappers
  const setApiConfig = useCallback((c: ApiConfig) => {
    setApiConfigState(c);
    save(KEYS.apiConfig, c);
  }, []);
  const setSystemPrompt = useCallback((s: string) => {
    setSystemPromptState(s);
    save(KEYS.systemPrompt, s);
  }, []);
  const setCurrentId = useCallback((id: string | null) => {
    setCurrentIdState(id);
    save(KEYS.currentConversation, id);
  }, []);
  const setPeriodData = useCallback((p: PeriodData) => {
    setPeriodDataState(p);
    save(KEYS.periodData, p);
  }, []);
  const setSettings = useCallback((s: Settings) => {
    setSettingsState(s);
    save(KEYS.settings, s);
  }, []);

  // Persist collections whenever they change (after hydration)
  useEffect(() => {
    if (hydrated) save(KEYS.conversations, conversations);
  }, [conversations, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.diary, diary);
  }, [diary, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.memories, memories);
  }, [memories, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.wishlist, wishlist);
  }, [wishlist, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.usageStats, usageStats);
  }, [usageStats, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.moods, moods);
  }, [moods, hydrated]);
  useEffect(() => {
    if (hydrated) save("cale_playlist", playlist);
  }, [playlist, hydrated]);
  useEffect(() => {
    if (hydrated) save("cale_bookshelf", bookshelf);
  }, [bookshelf, hydrated]);

  const addWish = useCallback(
    (title: string, source: WishItem["source"], description?: string) => {
      const clean = title.trim();
      if (!clean) return;
      setWishlist((prev) => {
        if (prev.some((w) => w.title === clean)) return prev;
        return [
          ...prev,
          {
            id: uid(),
            title: clean,
            description,
            status: "todo",
            source,
            createdAt: Date.now(),
          },
        ];
      });
    },
    []
  );

  const recordUsage = useCallback((input: number, output: number) => {
    if (!input && !output) return;
    const key = todayKey();
    setUsageStats((prev) => {
      const day = prev.days[key] ?? {
        date: key,
        inputTokens: 0,
        outputTokens: 0,
      };
      return {
        days: {
          ...prev.days,
          [key]: {
            date: key,
            inputTokens: day.inputTokens + input,
            outputTokens: day.outputTokens + output,
          },
        },
      };
    });
  }, []);

  const todayMood = moods.find((m) => m.date === todayKey());

  const setTodayMoodNote = useCallback((note: string) => {
    const key = todayKey();
    setMoods((prev) => {
      const existing = prev.find((m) => m.date === key);
      if (existing) {
        return prev.map((m) =>
          m.date === key
            ? { ...m, note: m.note ? `${m.note}；${note}` : note }
            : m
        );
      }
      return [...prev, { date: key, mood: "calm" as Mood, note }];
    });
  }, []);

  const value: AppState = {
    hydrated,
    apiConfig,
    setApiConfig,
    systemPrompt,
    setSystemPrompt,
    conversations,
    setConversations,
    currentId,
    setCurrentId,
    diary,
    setDiary,
    memories,
    setMemories,
    wishlist,
    setWishlist,
    periodData,
    setPeriodData,
    usageStats,
    setUsageStats,
    settings,
    setSettings,
    moods,
    setMoods,
    playlist,
    setPlaylist,
    bookshelf,
    setBookshelf,
    addWish,
    recordUsage,
    setTodayMoodNote,
    todayMood,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
