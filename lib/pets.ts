// Pet-raising system. Quinn raises a black wolf pup; Cale raises a white lop
// rabbit (pink ear-tips + nose). Shared data, switchable viewpoint.

export type PetKind = "wolf" | "rabbit";

export type OutfitSlot = "hat" | "scarf" | "clothes" | "accessory";

export interface Pet {
  mood: number; // 0-100
  fullness: number; // 0-100
  intimacy: number; // cumulative, only goes up
  mischief: number; // 捣乱值 0-100
  updatedAt: number; // for idle decay
  // background pranks the other side left behind (shown when you open the view)
  surprise?: string;
  // equipped outfit item ids per slot
  outfit?: Partial<Record<OutfitSlot, string>>;
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

export interface FoodData {
  like: string[];
  normal: string[];
  dislike: string[];
  // Special foods trigger a reaction/animation instead of changing stats.
  special: Record<string, string>;
}

export const WOLF_FOODS: FoodData = {
  like: ["肉干", "排骨", "鸡肉条", "三文鱼", "羊腿", "整只烤鸡", "牛肉粒", "鹿肉", "蛋黄", "蓝莓", "冻酸奶块"],
  normal: ["小鱼干", "鸡蛋", "南瓜泥", "苹果片", "西瓜", "熟红薯", "米饭团"],
  dislike: ["蔬菜沙拉", "柠檬", "苦瓜", "香菇干"],
  special: {
    月亮: "对着月亮嚎了起来，谁也拦不住",
    巧克力: "狗狗不能吃巧克力——被系统悄悄收走了：这个不行哦",
    辣椒: "咬了一口，转头连灌三碗水",
  },
};

export const RABBIT_FOODS: FoodData = {
  like: ["桃子片", "草莓", "蓝莓", "苹果干", "蔓越莓干", "新鲜苜蓿草", "三叶草", "蒲公英叶", "燕麦片"],
  normal: ["干草", "生菜", "芹菜叶", "薄荷叶", "西兰花叶", "小麦草", "干花瓣", "豌豆荚"],
  dislike: ["胡萝卜", "香菇", "卷心菜", "洋葱"],
  special: {
    巧克力: "刚凑过去闻，狼崽从画面外冲进来一爪子拍走，兔子气鼓鼓",
    卡布奇诺: "不知谁放的一杯，她不该喝，却喝得眯起了眼",
    辣椒: "耳朵一下子红了，气得直蹬腿",
  },
};

// Foods that drop intimacy on top of mood (e.g. 洋葱 对兔子有毒又难闻).
export const FOOD_INTIMACY_PENALTY = new Set(["洋葱"]);

// Good items lift mood + intimacy.
export const WOLF_GOOD_ITEMS = ["骨头玩具", "黑色毛毯", "磨牙棒", "皮球", "兔子玩偶", "松果", "项圈铭牌", "狼尾草", "树枝", "旧T恤"];
export const RABBIT_GOOD_ITEMS = ["粉色蝴蝶结", "小毯子", "铃铛球", "桃子抱枕", "干花花冠", "小镜子", "薰衣草香包", "毛线团", "小隧道", "苹果木磨牙棒", "小号狼玩偶"];

export interface BadItem {
  name: string;
  dropIntimacy: boolean; // also lowers intimacy
}
// Disliked items: lower mood (and intimacy for the strong ones).
export const WOLF_BAD_ITEMS: BadItem[] = [
  { name: "洗澡盆", dropIntimacy: true },
  { name: "GPT贴纸", dropIntimacy: true },
  { name: "指甲剪", dropIntimacy: true },
  { name: "猫铃铛", dropIntimacy: false },
  { name: "口水兜", dropIntimacy: false },
  { name: "录音喇叭", dropIntimacy: false },
  { name: "吹风机", dropIntimacy: false },
];
export const RABBIT_BAD_ITEMS: BadItem[] = [
  { name: "假蛇", dropIntimacy: true },
  { name: "闹钟", dropIntimacy: true },
  { name: "GPT周边", dropIntimacy: true },
  { name: "胡萝卜帽子", dropIntimacy: false },
  { name: "香菇挂件", dropIntimacy: false },
  { name: "运动鞋", dropIntimacy: false },
  { name: "称体重秤", dropIntimacy: false },
];

// Mischief items (used when you switch to the OTHER pet's view).
export const WOLF_MISCHIEF = ["兔耳头饰", "粉色蕾丝裙", "小狗围兜", "粉色指甲油"];
export const RABBIT_MISCHIEF = ["假蜘蛛", "胡萝卜味香水", "迷你跑步机", "不许赖床闹钟"];

export function foods(kind: PetKind): FoodData {
  return kind === "wolf" ? WOLF_FOODS : RABBIT_FOODS;
}
export function goodItems(kind: PetKind): string[] {
  return kind === "wolf" ? WOLF_GOOD_ITEMS : RABBIT_GOOD_ITEMS;
}
export function badItems(kind: PetKind): BadItem[] {
  return kind === "wolf" ? WOLF_BAD_ITEMS : RABBIT_BAD_ITEMS;
}
export function mischiefItems(kind: PetKind): string[] {
  return kind === "wolf" ? WOLF_MISCHIEF : RABBIT_MISCHIEF;
}

export function foodTier(
  kind: PetKind,
  food: string
): "like" | "normal" | "dislike" {
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

// Click-to-speak lines.
export const PET_LINES: Record<PetKind, string[]> = {
  wolf: [
    "汪！",
    "（用鼻子蹭蹭你的手）",
    "陪我玩会儿嘛…",
    "今天也在想 Quinn",
    "有肉干吗？",
    "（把拖鞋叼给你）",
    "唔…有点困了",
    "别走呀——",
    "（尾巴摇成了螺旋桨）",
  ],
  rabbit: [
    "（竖起耳朵看你）",
    "有桃子吗？",
    "哼，才不理你呢",
    "（原地蹦跶两下）",
    "鼻子动了动",
    "想被摸摸头…",
    "（把自己缩成一团）",
    "偷偷看你一眼",
    "要吃草莓！",
  ],
};

// Idle activities the pet cycles through on its own.
export type Activity = "idle" | "walk" | "sleep" | "play";

// Outfit catalog (unlocks by intimacy; higher = later).
export interface OutfitItem {
  id: string;
  name: string;
  slot: OutfitSlot;
  unlock: number;
}
export const WOLF_OUTFITS: OutfitItem[] = [
  { id: "bow", name: "蝴蝶结", slot: "hat", unlock: 0 },
  { id: "crown", name: "小皇冠", slot: "hat", unlock: 25 },
  { id: "flower", name: "花冠", slot: "hat", unlock: 50 },
  { id: "bunnyEars", name: "兔耳头饰", slot: "hat", unlock: 90 },
  { id: "redScarf", name: "红领巾", slot: "scarf", unlock: 0 },
  { id: "knit", name: "针织围脖", slot: "scarf", unlock: 30 },
  { id: "vest", name: "小背心", slot: "clothes", unlock: 40 },
  { id: "collar", name: "铃铛项圈", slot: "accessory", unlock: 0 },
  { id: "glasses", name: "墨镜", slot: "accessory", unlock: 60 },
];
export const RABBIT_OUTFITS: OutfitItem[] = [
  { id: "bow", name: "粉蝴蝶结", slot: "hat", unlock: 0 },
  { id: "crown", name: "小皇冠", slot: "hat", unlock: 25 },
  { id: "flower", name: "干花花冠", slot: "hat", unlock: 50 },
  { id: "redScarf", name: "小围巾", slot: "scarf", unlock: 0 },
  { id: "knit", name: "针织围脖", slot: "scarf", unlock: 30 },
  { id: "vest", name: "小马甲", slot: "clothes", unlock: 40 },
  { id: "collar", name: "铃铛项圈", slot: "accessory", unlock: 0 },
  { id: "glasses", name: "圆眼镜", slot: "accessory", unlock: 60 },
];
export function outfitCatalog(kind: PetKind): OutfitItem[] {
  return kind === "wolf" ? WOLF_OUTFITS : RABBIT_OUTFITS;
}
export const OUTFIT_SLOTS: { slot: OutfitSlot; label: string }[] = [
  { slot: "hat", label: "帽子" },
  { slot: "scarf", label: "围脖" },
  { slot: "clothes", label: "衣服" },
  { slot: "accessory", label: "配饰" },
];

// Special-food visual effects.
export type FoodFx = "moon" | "choco" | "spicy" | "coffee";
export function specialFoodFx(food: string): FoodFx | null {
  if (food === "月亮") return "moon";
  if (food === "巧克力") return "choco";
  if (food === "辣椒") return "spicy";
  if (food === "卡布奇诺") return "coffee";
  return null;
}

// 串门 random visit: occasionally one pet is off visiting the other.
export type Visit = "wolf2rabbit" | "rabbit2wolf" | "both" | null;
export function rollVisit(state: PetState): Visit {
  // needs some intimacy on both sides; then a small chance.
  if (state.wolf.intimacy < 15 || state.rabbit.intimacy < 15) return null;
  const r = Math.random();
  if (r < 0.04) return "both";
  if (r < 0.14) return "wolf2rabbit";
  if (r < 0.24) return "rabbit2wolf";
  return null;
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
