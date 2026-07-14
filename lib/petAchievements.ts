// Achievements: cumulative milestones across pet interactions. Unlocking one
// grants a badge that hangs by the nest.

import { WOLF_FOODS, RABBIT_FOODS, RABBIT_BAD_ITEMS } from "./pets";

export interface AchProgress {
  unlocked: Record<string, number>; // id -> timestamp
  visitDays: number; // consecutive days the app was opened
  visitLast: string; // last day key counted
  mischief: number;
  choco: number;
  visits: number; // 串门 events seen
  bothEgg: number; // 两只同时消失
  notes: number;
  peeked: boolean; // opened a pet diary
  birthday: boolean; // opened on 4/20
  likedW: string[];
  likedR: string[];
  dislikedW: string[];
  dislikedR: string[];
  badR: string[]; // disliked items forced on the rabbit
}

export const freshProgress = (): AchProgress => ({
  unlocked: {},
  visitDays: 0,
  visitLast: "",
  mischief: 0,
  choco: 0,
  visits: 0,
  bothEgg: 0,
  notes: 0,
  peeked: false,
  birthday: false,
  likedW: [],
  likedR: [],
  dislikedW: [],
  dislikedR: [],
  badR: [],
});

const covers = (have: string[], all: string[]) =>
  all.length > 0 && all.every((x) => have.includes(x));

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  check: (p: AchProgress) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "rain", name: "风雨无阻", desc: "连续 7 天来看它们", emoji: "☔", check: (p) => p.visitDays >= 7 },
  { id: "sun", name: "日不落", desc: "连续 30 天来看它们", emoji: "🌞", check: (p) => p.visitDays >= 30 },
  { id: "wanted", name: "头号通缉犯", desc: "捣乱 10 次", emoji: "🚨", check: (p) => p.mischief >= 10 },
  { id: "repeat", name: "惯犯", desc: "捣乱 50 次", emoji: "⛓️", check: (p) => p.mischief >= 50 },
  { id: "rush", name: "双向奔赴", desc: "触发串门 5 次", emoji: "💞", check: (p) => p.visits >= 5 },
  { id: "elope", name: "私奔现场", desc: "两只同时消失 1 次", emoji: "🏃", check: (p) => p.bothEgg >= 1 },
  { id: "foodie", name: "美食家", desc: "喂遍某只的所有爱吃", emoji: "🍖", check: (p) => covers(p.likedW, WOLF_FOODS.like) || covers(p.likedR, RABBIT_FOODS.like) },
  { id: "evil", name: "黑心饲主", desc: "喂遍某只的所有讨厌", emoji: "😈", check: (p) => covers(p.dislikedW, WOLF_FOODS.dislike) || covers(p.dislikedR, RABBIT_FOODS.dislike) },
  { id: "choco", name: "屡教不改", desc: "触发巧克力动画 5 次", emoji: "🍫", check: (p) => p.choco >= 5 },
  { id: "cruel", name: "她哭了你开心了吗", desc: "给兔子用遍讨厌物品", emoji: "🥲", check: (p) => covers(p.badR, RABBIT_BAD_ITEMS.map((b) => b.name)) },
  { id: "peek", name: "偷窥犯", desc: "第一次翻开它们的日记", emoji: "🔍", check: (p) => p.peeked },
  { id: "hollow", name: "树洞", desc: "留言条累计 10 张", emoji: "🌳", check: (p) => p.notes >= 10 },
  { id: "birthday", name: "生日快乐", desc: "4 月 20 日登录（限定）", emoji: "🎂", check: (p) => p.birthday },
];

// Returns ids that just became satisfied but aren't unlocked yet.
export function newlyUnlocked(p: AchProgress): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(p) && !p.unlocked[a.id]).map((a) => a.id);
}
