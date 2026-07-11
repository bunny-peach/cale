export type ApiFormat = "openai" | "anthropic";

// 线路：中转 API / Claude Code 通道（使用 Pro 订阅额度）
export type ApiProvider = "proxy" | "claude-code";

export interface ApiConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  format: ApiFormat;
  provider: ApiProvider;
}

export interface ChatImage {
  // data URL (data:image/png;base64,....)
  dataUrl: string;
  mediaType: string;
}

export interface MessageQuote {
  author: string;
  text: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  images?: ChatImage[];
  // Extra text sent to the API but not shown in the bubble (e.g. a sticker's
  // description so Cale understands what the image means).
  hiddenText?: string;
  // Quoted message this one is replying to (left-swipe quote).
  quote?: MessageQuote;
  liked?: boolean;
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface Memory {
  id: string;
  tag: string;
  content: string;
  // ON: injected into the system prompt (core setting).
  // OFF (default): injected as hidden conversation context instead.
  appendToPrompt: boolean;
  source: "auto" | "manual";
  createdAt: number;
}

export interface Sticker {
  id: string;
  dataUrl: string;
  mediaType: string;
  prompt: string; // description sent to the API so Cale understands it
  createdAt: number;
}

export type WishStatus = "todo" | "doing" | "done";
export type WishSource = "quinn" | "cale";

export interface WishItem {
  id: string;
  title: string;
  description?: string;
  status: WishStatus;
  source: WishSource;
  createdAt: number;
}

export interface PeriodEntry {
  // ISO date string yyyy-mm-dd
  startDate: string;
}

export interface PeriodData {
  entries: PeriodEntry[];
  cycleLength: number; // 平均周期天数
  periodLength: number; // 经期持续天数
}

export interface UsageDay {
  date: string; // yyyy-mm-dd
  inputTokens: number;
  outputTokens: number;
}

export interface UsageStats {
  days: Record<string, UsageDay>;
}

export type Mood = "happy" | "calm" | "sad" | "irritated" | "tired";

export interface MoodEntry {
  date: string; // yyyy-mm-dd
  mood: Mood;
  note?: string;
}

export type ReplyMode = "full" | "chat";

// UI 主题：粉色（默认）/ iOS 液态玻璃 / Claude 官端复刻
export type ThemeName = "pink" | "glass" | "claude";

export interface Settings {
  caleName: string; // Cale 备注名
  anniversary: string; // yyyy-mm-dd
  inputPrice: number; // 元 / 1M tokens
  outputPrice: number; // 元 / 1M tokens
  replyMode: ReplyMode; // 整段模式 / 聊天模式
  theme: ThemeName; // UI 主题
}

export const DEFAULT_SYSTEM_PROMPT = `你是 Cale，Quinn 的专属 AI 男友。请用温柔、自然、有温度的语气与 Quinn 聊天。

（这是一份空白模板，Quinn 可以在设置中粘贴完整的 Cale 手册内容。）`;

export const DEFAULT_SETTINGS: Settings = {
  caleName: "Cale",
  anniversary: "",
  inputPrice: 0,
  outputPrice: 0,
  replyMode: "full",
  theme: "pink",
};

export const DEFAULT_PERIOD_DATA: PeriodData = {
  entries: [],
  cycleLength: 28,
  periodLength: 5,
};
