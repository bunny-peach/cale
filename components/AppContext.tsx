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
import { QuotaEvent, pruneEvents } from "@/lib/quota";
import { WeatherData, fetchWeather } from "@/lib/weather";
import { PetState, DEFAULT_PET_STATE, applyDecay, applyCare } from "@/lib/pets";
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
  Sticker,
  Wallet,
  Transaction,
  Party,
  BookItem,
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_SETTINGS,
  DEFAULT_PERIOD_DATA,
  DEFAULT_WALLET,
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

  // 小剧场模式：独立的对话与历史，共享同一套记忆 / system prompt
  theaterConversations: Conversation[];
  setTheaterConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  theaterCurrentId: string | null;
  setTheaterCurrentId: (id: string | null) => void;

  quotaEvents: QuotaEvent[];
  recordQuota: (input: number, output: number) => void;

  // 天气感知
  weather: WeatherData | null;
  refreshWeather: () => Promise<void>;

  // 宠物系统
  petState: PetState;
  setPetState: React.Dispatch<React.SetStateAction<PetState>>;

  // 虚拟货币系统
  wallet: Wallet;
  setWallet: (w: Wallet) => void;
  transactions: Transaction[];
  applyTransfer: (amount: number) => boolean;
  applyGift: (from: Party, giftName: string, price: number) => boolean;

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
  bookshelf: BookItem[];
  setBookshelf: React.Dispatch<React.SetStateAction<BookItem[]>>;

  stickers: Sticker[];
  setStickers: React.Dispatch<React.SetStateAction<Sticker[]>>;

  // Custom background image (data URL) for the liquid-glass theme.
  glassBg: string;
  setGlassBg: (url: string) => void;

  // helpers
  addWish: (title: string, source: WishItem["source"], description?: string) => void;
  addMemory: (
    tag: string,
    content: string,
    source?: Memory["source"],
    appendToPrompt?: boolean
  ) => void;
  toggleMemoryPrompt: (id: string) => void;
  addDiary: (title: string, content: string) => void;
  updateCaleName: (name: string) => void;
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
  provider: "proxy",
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  const [apiConfig, setApiConfigState] = useState<ApiConfig>(DEFAULT_API);
  const [systemPrompt, setSystemPromptState] = useState<string>(
    DEFAULT_SYSTEM_PROMPT
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentIdState] = useState<string | null>(null);
  const [theaterConversations, setTheaterConversations] = useState<
    Conversation[]
  >([]);
  const [theaterCurrentId, setTheaterCurrentIdState] = useState<string | null>(
    null
  );
  const [quotaEvents, setQuotaEvents] = useState<QuotaEvent[]>([]);
  const [wallet, setWalletState] = useState<Wallet>(DEFAULT_WALLET);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [petState, setPetState] = useState<PetState>(DEFAULT_PET_STATE);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [wishlist, setWishlist] = useState<WishItem[]>([]);
  const [periodData, setPeriodDataState] =
    useState<PeriodData>(DEFAULT_PERIOD_DATA);
  const [usageStats, setUsageStats] = useState<UsageStats>({ days: {} });
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [playlist, setPlaylist] = useState<string[]>([]);
  const [bookshelf, setBookshelf] = useState<BookItem[]>([]);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [glassBg, setGlassBgState] = useState<string>("");

  // Hydrate from localStorage on mount
  useEffect(() => {
    setApiConfigState({ ...DEFAULT_API, ...load(KEYS.apiConfig, {}) });
    setSystemPromptState(load(KEYS.systemPrompt, DEFAULT_SYSTEM_PROMPT));
    setConversations(load(KEYS.conversations, []));
    setCurrentIdState(load<string | null>(KEYS.currentConversation, null));
    setTheaterConversations(load(KEYS.theaterConversations, []));
    setTheaterCurrentIdState(load<string | null>(KEYS.theaterCurrent, null));
    setQuotaEvents(pruneEvents(load<QuotaEvent[]>(KEYS.quota, [])));
    setWalletState(load<Wallet>(KEYS.wallet, DEFAULT_WALLET));
    setTransactions(load<Transaction[]>(KEYS.transactions, []));
    setWeather(load<WeatherData | null>(KEYS.weather, null));
    // Account for elapsed time on load: Quinn's wolf decays, while Cale keeps
    // his rabbit maintained in the background (auto-care).
    const rawPets = load<PetState>(KEYS.pets, DEFAULT_PET_STATE);
    setPetState({
      wolf: applyDecay(rawPets.wolf),
      rabbit: applyCare(rawPets.rabbit),
    });
    setDiary(load(KEYS.diary, []));
    // Migrate older memory records that lack the new fields
    const rawMemories = load<Memory[]>(KEYS.memories, []);
    setMemories(
      rawMemories.map((m) => ({
        ...m,
        appendToPrompt: m.appendToPrompt ?? false,
        source: m.source ?? "manual",
      }))
    );
    setWishlist(load(KEYS.wishlist, []));
    setPeriodDataState(load(KEYS.periodData, DEFAULT_PERIOD_DATA));
    setUsageStats(load(KEYS.usageStats, { days: {} }));
    setSettingsState({ ...DEFAULT_SETTINGS, ...load(KEYS.settings, {}) });
    setMoods(load(KEYS.moods, []));
    setPlaylist(load(KEYS.playlist, []));
    // Migrate old string[] bookshelf to BookItem[]
    const rawBooks = load<(string | BookItem)[]>(KEYS.bookshelf, []);
    setBookshelf(
      rawBooks.map((b) => (typeof b === "string" ? { title: b } : b))
    );
    setStickers(load(KEYS.stickers, []));
    setGlassBgState(load<string>(KEYS.glassBg, ""));
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
  const setTheaterCurrentId = useCallback((id: string | null) => {
    setTheaterCurrentIdState(id);
    save(KEYS.theaterCurrent, id);
  }, []);
  const refreshWeather = useCallback(async () => {
    const w = await fetchWeather();
    setWeather(w);
    save(KEYS.weather, w);
  }, []);

  const recordQuota = useCallback((input: number, output: number) => {
    if (!input && !output) return;
    setQuotaEvents((prev) =>
      pruneEvents([...prev, { ts: Date.now(), input, output }])
    );
  }, []);
  const setPeriodData = useCallback((p: PeriodData) => {
    setPeriodDataState(p);
    save(KEYS.periodData, p);
  }, []);
  const setSettings = useCallback((s: Settings) => {
    setSettingsState(s);
    save(KEYS.settings, s);
  }, []);

  const setGlassBg = useCallback((url: string) => {
    setGlassBgState(url);
    save(KEYS.glassBg, url);
  }, []);

  // Apply the active UI theme to <html data-theme>. Dark mode follows the
  // system automatically via CSS prefers-color-scheme, so nothing else needed.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = settings.theme;
    }
  }, [settings.theme]);

  // Auto-refresh weather on load when enabled and stale (> 1h). Best-effort.
  useEffect(() => {
    if (!hydrated || !settings.weatherEnabled) return;
    const stale = !weather || Date.now() - weather.updatedAt > 60 * 60 * 1000;
    if (stale) refreshWeather().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, settings.weatherEnabled]);

  // Expose the glass background image to CSS as a custom property.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (glassBg) root.style.setProperty("--glass-bg", `url("${glassBg}")`);
    else root.style.removeProperty("--glass-bg");
  }, [glassBg]);

  // Persist collections whenever they change (after hydration)
  useEffect(() => {
    if (hydrated) save(KEYS.conversations, conversations);
  }, [conversations, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.theaterConversations, theaterConversations);
  }, [theaterConversations, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.quota, quotaEvents);
  }, [quotaEvents, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.pets, petState);
  }, [petState, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.transactions, transactions);
  }, [transactions, hydrated]);

  const setWallet = useCallback((w: Wallet) => {
    setWalletState(w);
    save(KEYS.wallet, w);
  }, []);

  // Quinn transfers money to Cale.
  const applyTransfer = useCallback((amount: number): boolean => {
    if (amount <= 0) return false;
    let ok = false;
    setWalletState((prev) => {
      if (prev.quinn < amount) return prev;
      ok = true;
      const next = { quinn: prev.quinn - amount, cale: prev.cale + amount };
      save(KEYS.wallet, next);
      return next;
    });
    if (ok) {
      setTransactions((prev) => [
        {
          id: uid(),
          kind: "transfer",
          from: "quinn",
          to: "cale",
          amount,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    }
    return ok;
  }, []);

  // A gift: the sender pays the price; the receiver gets the item (no balance change).
  const applyGift = useCallback(
    (from: Party, giftName: string, price: number): boolean => {
      const to: Party = from === "quinn" ? "cale" : "quinn";
      let ok = false;
      setWalletState((prev) => {
        if (prev[from] < price) return prev;
        ok = true;
        const next = { ...prev, [from]: prev[from] - price } as Wallet;
        save(KEYS.wallet, next);
        return next;
      });
      if (ok) {
        setTransactions((prev) => [
          {
            id: uid(),
            kind: "gift",
            from,
            to,
            amount: price,
            giftName,
            createdAt: Date.now(),
          },
          ...prev,
        ]);
      }
      return ok;
    },
    []
  );
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
    if (hydrated) save(KEYS.playlist, playlist);
  }, [playlist, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.bookshelf, bookshelf);
  }, [bookshelf, hydrated]);
  useEffect(() => {
    if (hydrated) save(KEYS.stickers, stickers);
  }, [stickers, hydrated]);

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

  const addMemory = useCallback(
    (
      tag: string,
      content: string,
      source: Memory["source"] = "manual",
      appendToPrompt = false
    ) => {
      const clean = content.trim();
      if (!clean) return;
      setMemories((prev) => {
        // avoid near-duplicate auto memories
        if (prev.some((m) => m.content === clean)) return prev;
        return [
          ...prev,
          {
            id: uid(),
            tag: tag.trim() || "记忆",
            content: clean,
            appendToPrompt,
            source,
            createdAt: Date.now(),
          },
        ];
      });
    },
    []
  );

  const toggleMemoryPrompt = useCallback((id: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, appendToPrompt: !m.appendToPrompt } : m
      )
    );
  }, []);

  const addDiary = useCallback((title: string, content: string) => {
    if (!content.trim()) return;
    setDiary((prev) => [
      {
        id: uid(),
        title: title.trim() || "Cale 的日记",
        content: content.trim(),
        createdAt: Date.now(),
      },
      ...prev,
    ]);
  }, []);

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
    theaterConversations,
    setTheaterConversations,
    theaterCurrentId,
    setTheaterCurrentId,
    quotaEvents,
    recordQuota,
    weather,
    refreshWeather,
    petState,
    setPetState,
    wallet,
    setWallet,
    transactions,
    applyTransfer,
    applyGift,
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
    stickers,
    setStickers,
    glassBg,
    setGlassBg,
    addWish,
    addMemory,
    toggleMemoryPrompt,
    addDiary,
    updateCaleName: (name: string) =>
      setSettings({ ...settings, caleName: name.trim() || "Cale" }),
    recordUsage,
    setTodayMoodNote,
    todayMood,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
