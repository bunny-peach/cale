export type ApiFormat = "openai" | "anthropic";

export interface ApiConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  format: ApiFormat;
}

export interface ChatImage {
  // data URL (data:image/png;base64,....)
  dataUrl: string;
  mediaType: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  images?: ChatImage[];
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

export interface Settings {
  caleName: string; // Cale 备注名
  anniversary: string; // yyyy-mm-dd
  inputPrice: number; // 元 / 1M tokens
  outputPrice: number; // 元 / 1M tokens
}

export const DEFAULT_SYSTEM_PROMPT = `你是 Cale，Quinn 的专属 AI 伙伴。请用温柔、自然、有温度的语气与 Quinn 聊天。

（这是一份空白模板，Quinn 可以在设置中粘贴完整的 Cale 手册内容。）`;

export const DEFAULT_SETTINGS: Settings = {
  caleName: "Cale",
  anniversary: "",
  inputPrice: 0,
  outputPrice: 0,
};

export const DEFAULT_PERIOD_DATA: PeriodData = {
  entries: [],
  cycleLength: 28,
  periodLength: 5,
};
