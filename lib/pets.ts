// Pet-raising system. Quinn raises a black wolf pup; Cale raises a white lop
// rabbit (pink ear-tips + nose). Shared data, switchable viewpoint.

export type PetKind = "wolf" | "rabbit";

export interface Pet {
  mood: number; // 0-100
  fullness: number; // 0-100
  intimacy: number; // cumulative, only goes up
  mischief: number; // 捣乱值 0-100
  updatedAt: number; // for idle decay
  // background pranks the other side left behind (shown when you open the view)
  surprise?: string;
}

export interface PetState {
  wolf: Pet;
  rabbit: Pet;
}

const freshPet = (): Pet => ({
  mood: 80,
  fullness: 70,
  intimacy: 0,
  mischief: 0,
  updatedAt: Date.now(),
});

export const DEFAULT_PET_STATE: PetState = {
  wolf: freshPet(),
  rabbit: freshPet(),
};

export interface FoodTiers {
  like: string[];
  normal: string[];
  dislike: string[];
}

export const WOLF_FOODS: FoodTiers = {
  like: ["肉干", "排骨", "小鱼干", "鸡肉条", "奶酪", "牛肉粒", "烤鸡腿", "三文鱼", "羊肉串", "蛋黄酥"],
  normal: ["桃子", "饼干", "面包", "蛋挞", "年糕", "薯片", "米饭团", "苹果", "西瓜", "酸奶", "爆米花", "小蛋糕"],
  dislike: ["蔬菜沙拉", "香菇干", "苦瓜", "柠檬", "芥末团子", "黑咖啡"],
};

export const RABBIT_FOODS: FoodTiers = {
  like: ["桃子", "草莓", "小饼干", "燕麦棒", "苹果干", "蓝莓", "樱桃", "棉花糖", "布丁", "蜂蜜水", "芒果干", "葡萄"],
  normal: ["生菜", "干草", "小面包", "麦片", "玉米粒", "豌豆", "西瓜", "酸奶球", "小番茄", "花生"],
  dislike: ["胡萝卜", "香菇", "包子", "猪肉包", "内脏干", "芥末", "辣椒"],
};

// Good items lift mood + intimacy.
export const WOLF_GOOD_ITEMS = ["骨头玩具", "黑色毛毯", "磨牙棒", "皮球", "兔子玩偶", "松果", "项圈铭牌", "狼尾草"];
export const RABBIT_GOOD_ITEMS = ["粉色蝴蝶结", "小毯子", "铃铛球", "桃子抱枕", "干花花冠", "小镜子", "薰衣草香包", "毛线团"];

// Mischief items/actions (used when you switch to the OTHER pet's view).
export const WOLF_MISCHIEF = ["兔耳头饰", "小狗围兜", "粉色指甲油", "戳耳朵", "弄乱窝"];
export const RABBIT_MISCHIEF = ["假蜘蛛", "胡萝卜味香水", "假蛇", "胡萝卜帽子", "戳耳朵", "偷吃食物"];

export function foods(kind: PetKind): FoodTiers {
  return kind === "wolf" ? WOLF_FOODS : RABBIT_FOODS;
}
export function goodItems(kind: PetKind): string[] {
  return kind === "wolf" ? WOLF_GOOD_ITEMS : RABBIT_GOOD_ITEMS;
}
export function mischiefItems(kind: PetKind): string[] {
  return kind === "wolf" ? WOLF_MISCHIEF : RABBIT_MISCHIEF;
}

export function foodTier(kind: PetKind, food: string): keyof FoodTiers {
  const f = foods(kind);
  if (f.like.includes(food)) return "like";
  if (f.dislike.includes(food)) return "dislike";
  return "normal";
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

// Idle decay: fullness ~ -3/h, mood ~ -1.5/h. Intimacy never drops.
export function applyDecay(pet: Pet, now = Date.now()): Pet {
  const hours = (now - pet.updatedAt) / (60 * 60 * 1000);
  if (hours <= 0) return pet;
  return {
    ...pet,
    fullness: clamp(pet.fullness - hours * 3),
    mood: clamp(pet.mood - hours * 1.5),
    updatedAt: now,
  };
}

export const petName = (k: PetKind) => (k === "wolf" ? "狼崽" : "兔子");

// Wolf mood/pose derived from how long since Quinn last chatted.
export function wolfPresence(lastActive: number | null, now = Date.now()): {
  pose: "happy" | "droopy" | "waiting";
  caption: string;
} {
  if (!lastActive) return { pose: "happy", caption: "摇着尾巴等你来玩" };
  const days = (now - lastActive) / (24 * 60 * 60 * 1000);
  if (days >= 3)
    return { pose: "waiting", caption: "叼着拖鞋，蹲在门口等你回来" };
  if (days >= 1) return { pose: "droopy", caption: "趴着，耳朵耷拉下来" };
  return { pose: "happy", caption: "精神很好，尾巴摇个不停" };
}

// A short status line for the system prompt so Cale can mention it occasionally.
export function petPromptSummary(state: PetState): string {
  const w = state.wolf;
  const r = state.rabbit;
  const parts = [
    `狼崽（Quinn 养的）心情 ${Math.round(w.mood)}、饱腹 ${Math.round(
      w.fullness
    )}、亲密 ${w.intimacy}`,
    `兔子（你养的）心情 ${Math.round(r.mood)}、饱腹 ${Math.round(
      r.fullness
    )}、亲密 ${r.intimacy}`,
  ];
  if (r.mischief >= 60)
    parts.push("兔子最近好像被人捣乱了，有点炸毛/缩窝，你能隐约察觉但不知道是谁干的");
  if (w.surprise) parts.push(`狼崽身上出现了：${w.surprise}`);
  return (
    `【宠物】${parts.join("；")}。` +
    `你可以偶尔（不是每次）自然地提到兔子的状态，尤其是它被捣乱时的异常反应，但不要点破是谁干的。`
  );
}
