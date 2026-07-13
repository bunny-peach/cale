"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Utensils,
  Hand,
  Sparkles,
  Ghost,
  Heart,
  Shirt,
  Moon,
  Ban,
  Droplets,
  Coffee,
  Star,
  Music,
  Ticket,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import { load, save, KEYS, todayKey } from "@/lib/storage";
import {
  PetKind,
  Pet,
  BadItem,
  OutfitSlot,
  FoodFx,
  Visit,
  foods,
  goodItems,
  badItems,
  mischiefItems,
  foodTier,
  applyDecay,
  petName,
  wolfPresence,
  FOOD_INTIMACY_PENALTY,
  petLine,
  PetActivity,
  petActivities,
  CouponState,
  freshCoupons,
  refillCoupons,
  COUPON_MAX,
  FEED_COST,
  PLAY_COST,
  outfitCatalog,
  OUTFIT_SLOTS,
  specialFoodFx,
  rollVisit,
} from "@/lib/pets";
import { WolfArt, RabbitArt } from "./PetArt";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PetView() {
  const { petState, setPetState } = useApp();
  const [view, setView] = useState<PetKind>("wolf");
  const [sheet, setSheet] = useState<null | "food" | "item" | "mischief" | "outfit">(
    null
  );
  const [toast, setToast] = useState<string | null>(null);
  const [bounce, setBounce] = useState(0);
  const [speech, setSpeech] = useState<string | null>(null);
  const [stageFx, setStageFx] = useState<{ icon: string; key: number } | null>(
    null
  );
  const [reaction, setReaction] = useState<{ anim: string; key: number } | null>(
    null
  );
  const [posX, setPosX] = useState(0);
  const [facing] = useState(1);
  const [activity, setActivity] = useState<PetActivity | null>(null);
  const posRef = useRef(0);
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [coupons, setCoupons] = useState<CouponState>(() =>
    freshCoupons(todayKey())
  );

  useEffect(() => {
    setPetState((prev) => ({
      wolf: applyDecay(prev.wolf),
      rabbit: applyDecay(prev.rabbit),
    }));
    // Load + daily-refill the snack coupons.
    const today = todayKey();
    const loaded = refillCoupons(
      load<CouponState>(KEYS.petCoupons, freshCoupons(today)),
      today
    );
    setCoupons(loaded);
    save(KEYS.petCoupons, loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateCoupons = (n: number) => {
    const next = { n: Math.max(0, Math.min(COUPON_MAX, n)), date: todayKey() };
    setCoupons(next);
    save(KEYS.petCoupons, next);
  };
  // Try to spend `cost` coupons; returns false (and warns) when short.
  const spendCoupons = (cost: number): boolean => {
    if (coupons.n < cost) {
      showToast("零食券不够啦，摸摸它或明天再来～");
      return false;
    }
    updateCoupons(coupons.n - cost);
    return true;
  };
  const earnCoupon = () => {
    if (coupons.n < COUPON_MAX) updateCoupons(coupons.n + 1);
  };

  const pet = petState[view];
  const isOwn = view === "wolf";
  const lastActive = useMemo(
    () => load<number | null>(KEYS.lastActive, null),
    []
  );
  const presence = wolfPresence(lastActive);
  const hiding = view === "rabbit" && pet.mischief >= 100;
  const grumpy = view === "rabbit" && (pet.mischief >= 60 || pet.mood < 22);
  const cappuccino = useMemo(() => Math.random() < 0.12, []);
  const visit = useMemo<Visit>(() => rollVisit(petState), []);

  // 串门 state for the current view
  const awayHere =
    (view === "wolf" && visit === "wolf2rabbit") ||
    (view === "rabbit" && visit === "rabbit2wolf") ||
    visit === "both";
  const guestKind: PetKind | null =
    view === "rabbit" && visit === "wolf2rabbit"
      ? "wolf"
      : view === "wolf" && visit === "rabbit2wolf"
        ? "rabbit"
        : null;

  const allFoods = useMemo(() => {
    const f = foods(view);
    return shuffle([
      ...f.like,
      ...f.normal,
      ...f.dislike,
      ...Object.keys(f.special),
    ]);
  }, [view]);
  const allItems = useMemo(
    () => shuffle([...goodItems(view), ...badItems(view).map((b) => b.name)]),
    [view]
  );

  // ---- Idle activities: the pet mostly stays put and plays with a little
  // prop (holds a plushie, nibbles a snack, …) instead of pacing around. ----
  const canAct =
    !awayHere &&
    (view === "wolf" ? presence.pose === "happy" : !grumpy && !hiding);
  useEffect(() => {
    setPosX(0);
    posRef.current = 0;
    if (!canAct) {
      setActivity(null);
      return;
    }
    const acts = petActivities(view);
    setActivity(acts[Math.floor(Math.random() * acts.length)]);
    const tick = () => {
      // alternate between playing with something and a plain idle beat
      setActivity((cur) =>
        cur ? null : acts[Math.floor(Math.random() * acts.length)]
      );
      setBounce((b) => b + 1);
    };
    const id = setInterval(tick, 4200 + Math.random() * 2200);
    return () => clearInterval(id);
  }, [canAct, view]);

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1600);
  };

  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // The pet reacts: a specific animation + a spoken line + an optional floating fx.
  const react2 = (anim: string, line: string, fxIcon?: string) => {
    setActivity(null); // drop whatever it was holding to react to you
    setReaction({ anim, key: Date.now() });
    setSpeech(line);
    if (speechTimer.current) clearTimeout(speechTimer.current);
    speechTimer.current = setTimeout(() => setSpeech(null), 2400);
    if (fxIcon) {
      setStageFx({ icon: fxIcon, key: Date.now() });
      setTimeout(() => setStageFx(null), 1400);
    }
  };

  const speak = () => {
    // 炸毛缩窝: no matter how you poke it, it won't say a word — just a shiver.
    if (hiding) {
      setReaction({ anim: "pet-shake", key: Date.now() });
      return;
    }
    const line = petLine(view, {
      mood: pet.mood,
      fullness: pet.fullness,
      intimacy: pet.intimacy,
      hiding,
      grumpy,
    });
    if (!line) {
      setReaction({ anim: "pet-shake", key: Date.now() });
      return;
    }
    // Grumpy pets get a shake, others a gentle nod.
    react2(grumpy ? "pet-shake" : "pet-nod", line);
  };

  const mutate = (fn: (p: Pet) => Pet) =>
    setPetState((prev) => ({ ...prev, [view]: fn(prev[view]) }));

  const feed = (food: string) => {
    if (!spendCoupons(FEED_COST)) return;
    const special = foods(view).special[food];
    if (special) {
      setSheet(null);
      const fx = specialFoodFx(food);
      react2(fx === "moon" ? "pet-nod" : "pet-shake", special, fx ?? undefined);
      return;
    }
    const tier = foodTier(view, food);
    const penalty = FOOD_INTIMACY_PENALTY.has(food);
    mutate((p) => ({
      ...p,
      fullness: clamp(p.fullness + 15),
      mood: clamp(p.mood + (tier === "like" ? 8 : tier === "dislike" ? -10 : 0)),
      mischief: clamp(p.mischief + (tier === "dislike" && !isOwn ? 8 : 0)),
      intimacy: Math.max(0, p.intimacy + (penalty ? -2 : 2)),
      updatedAt: Date.now(),
    }));
    setSheet(null);
    if (tier === "like")
      react2("pet-jump", pick(["好好吃！", "还要还要～", "（大口吃光）"]), "heart");
    else if (tier === "dislike")
      react2("pet-shake", pick(["唔…不喜欢这个", "（皱脸推开）", "才不要吃…"]));
    else react2("pet-nod", pick(["嗯，吃饱啦", "还行～"]), "note");
  };

  const play = (item: string) => {
    mutate((p) => ({
      ...p,
      mood: clamp(p.mood + 7),
      intimacy: p.intimacy + 2,
      updatedAt: Date.now(),
    }));
    setSheet(null);
    react2("pet-jump", `${item}！我最喜欢啦`, "heart");
  };

  const giveBad = (item: BadItem) => {
    mutate((p) => ({
      ...p,
      mood: clamp(p.mood - 9),
      intimacy: item.dropIntimacy ? Math.max(0, p.intimacy - 3) : p.intimacy,
      updatedAt: Date.now(),
    }));
    setSheet(null);
    react2("pet-shake", pick([`${item.name}？讨厌啦！`, "快拿走——", "（缩成一团）"]));
  };

  const mischief = (action: string) => {
    mutate((p) => ({
      ...p,
      mood: clamp(p.mood - 8),
      mischief: clamp(p.mischief + 12),
      updatedAt: Date.now(),
    }));
    setSheet(null);
    react2("pet-shake", pick(["喂——住手！", "（炸毛）", "哼，不理你了！"]));
  };

  const headPat = () => {
    mutate((p) => ({
      ...p,
      mood: clamp(p.mood + 5),
      intimacy: p.intimacy + 1,
      updatedAt: Date.now(),
    }));
    earnCoupon();
    react2("pet-nod", pick(["（眯眼蹭你）好舒服～", "再摸摸嘛", "唔…喜欢"]), "heart");
  };
  const tease = () => {
    mutate((p) => ({
      ...p,
      mood: clamp(p.mood + 6),
      intimacy: p.intimacy + 1,
      updatedAt: Date.now(),
    }));
    earnCoupon();
    react2("pet-wiggle", pick(["再来再来！", "嘿嘿，抓不到我～", "（原地转圈）"]), "star");
  };

  const equip = (slot: OutfitSlot, id: string | null) => {
    mutate((p) => {
      const outfit = { ...(p.outfit || {}) };
      if (id) outfit[slot] = id;
      else delete outfit[slot];
      return { ...p, outfit };
    });
  };

  const PetSprite = ({ size }: { size?: number }) =>
    view === "wolf" ? (
      <WolfArt pose={presence.pose} outfit={pet.outfit} hold={activity?.prop} size={size} />
    ) : (
      <RabbitArt
        grumpy={grumpy}
        hiding={hiding}
        happy={pet.mood >= 85}
        outfit={pet.outfit}
        hold={activity?.prop}
        size={size}
      />
    );

  return (
    <div className="h-full bg-cale-bg relative overflow-hidden">
      <header
        className="absolute top-0 inset-x-0 z-30 bg-cale-card border-b border-cale-divider flex items-center justify-center h-12"
        style={{ paddingTop: "var(--safe-top)", height: "calc(var(--safe-top) + 3rem)" }}
      >
        <div className="text-[17px] font-semibold">宠物小窝</div>
      </header>

      <div
        className="absolute inset-0 overflow-y-auto no-scrollbar"
        style={{ paddingTop: "calc(var(--safe-top) + 3rem)" }}
      >
      <div className="px-4 pt-3">
        <div className="flex bg-cale-input rounded-full p-0.5 text-[14px]">
          {(["wolf", "rabbit"] as PetKind[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setView(k);
                setSheet(null);
                setSpeech(null);
              }}
              className={`flex-1 py-1.5 rounded-full transition-colors ${
                view === k
                  ? "bg-cale-card text-cale-accent font-medium shadow-sm"
                  : "text-cale-textLight"
              }`}
            >
              {k === "wolf" ? "狼崽（你的）" : "兔子（Cale 的）"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Pet stage */}
        <div className="bg-cale-card rounded-[18px] pt-4 pb-5 flex flex-col items-center relative overflow-hidden">
          {/* speech bubble */}
          {speech && !awayHere && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 cale-pop">
              <div className="bg-cale-card border border-cale-divider rounded-[14px] px-3 py-1.5 text-[13px] text-cale-textDark shadow max-w-[240px] text-center">
                {speech}
              </div>
            </div>
          )}

          {/* floating fx (special foods + interaction feedback) */}
          {stageFx && !awayHere && (
            <div
              key={stageFx.key}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 gift-float text-cale-accent"
            >
              {stageFx.icon === "moon" && <Moon size={40} />}
              {stageFx.icon === "choco" && <Ban size={40} />}
              {stageFx.icon === "spicy" && <Droplets size={40} />}
              {stageFx.icon === "coffee" && <Coffee size={40} />}
              {stageFx.icon === "heart" && (
                <Heart size={38} fill="rgb(var(--cale-accent))" />
              )}
              {stageFx.icon === "star" && (
                <Star size={38} fill="rgb(var(--cale-accent))" />
              )}
              {stageFx.icon === "note" && <Music size={36} />}
            </div>
          )}

          <div className="h-[196px] w-full flex items-center justify-center relative">
            {awayHere ? (
              <div className="text-center text-cale-textLight text-[13px] px-6">
                {visit === "both"
                  ? "两只一起不见了…桌上留下半颗啃过的桃子"
                  : view === "wolf"
                    ? "他跑去找兔子了～ 切到兔子那边看看？"
                    : "她跑去找狼崽了～ 切到狼崽那边看看？"}
              </div>
            ) : (
              <button
                onClick={speak}
                className="block"
                style={{
                  transform: `translateX(${posX}px)`,
                  transition: "transform 2.4s ease-in-out",
                }}
                aria-label="逗它说话"
              >
                <div
                  key={bounce}
                  className="cale-pop"
                  style={{ animationDuration: "0.35s" }}
                >
                  <div key={reaction?.key} className={reaction?.anim}>
                    <div style={{ transform: `scaleX(${facing})` }}>
                      <PetSprite />
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* guest visitor */}
            {guestKind && !awayHere && (
              <div className="absolute bottom-0 right-4 opacity-95">
                {guestKind === "wolf" ? (
                  <WolfArt pose="happy" size={78} />
                ) : (
                  <RabbitArt size={78} />
                )}
              </div>
            )}
          </div>

          <div className="text-[13px] text-cale-textLight mt-1 px-6 text-center">
            {awayHere
              ? "点上面的切换看看另一边～"
              : guestKind === "wolf"
                ? "狼崽跑来了，趴在她旁边不肯走"
                : guestKind === "rabbit"
                  ? "兔子缩在他肚子底下，只露出耳朵"
                  : view === "wolf"
                    ? activity?.caption ?? presence.caption
                    : hiding
                      ? "炸毛了！缩成一团埋进窝里，怎么哄都不出来"
                      : grumpy
                        ? "气鼓鼓地缩进窝里，不太理人"
                        : activity?.caption ?? "软乎乎的，正竖着耳朵看你（点点它）"}
          </div>
          {view === "rabbit" && !grumpy && !awayHere && cappuccino && (
            <div className="mt-2 text-[12px] text-cale-accent text-center px-6">
              她面前不知谁放了一杯卡布奇诺，正喝得眯起眼…
            </div>
          )}
          {view === "wolf" && !awayHere && pet.surprise && (
            <button
              onClick={() =>
                mutate((p) => ({ ...p, surprise: undefined, updatedAt: Date.now() }))
              }
              className="mt-2 text-[12px] text-cale-accent text-center px-6 active:opacity-60"
            >
              咦？狼崽{pet.surprise}——好像是 Cale 干的好事，点一下帮它弄好
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="bg-cale-card rounded-[16px] p-4 mt-3 space-y-3">
          <Stat label="心情" value={pet.mood} />
          <Stat label="饱腹" value={pet.fullness} />
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-cale-textLight">亲密度</span>
            <span className="text-cale-accent font-medium flex items-center gap-1">
              <Heart size={13} fill="rgb(var(--cale-accent))" /> {pet.intimacy}
            </span>
          </div>
          {!isOwn && <Stat label="捣乱值" value={pet.mischief} danger />}
        </div>

        {/* Snack coupons — a daily budget so food & toys aren't unlimited */}
        <div className="flex items-center justify-center gap-1.5 mt-3 text-[12px] text-cale-textLight">
          <Ticket size={14} className="text-cale-accent" />
          今日零食券
          <span className="text-cale-accent font-semibold">{coupons.n}</span>
          <span className="opacity-70">· 喂食/陪玩各 1，摸头逗它可回补</span>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Action icon={<Utensils size={20} />} label="喂食" onClick={() => setSheet("food")} />
          {isOwn ? (
            <>
              <Action icon={<Hand size={20} />} label="摸头" onClick={headPat} />
              <Action icon={<Sparkles size={20} />} label="逗他" onClick={tease} />
              <Action icon={<Heart size={20} />} label="陪玩" onClick={() => setSheet("item")} />
            </>
          ) : (
            <>
              <Action icon={<Ghost size={20} />} label="捣乱" onClick={() => setSheet("mischief")} />
              <Action icon={<Heart size={20} />} label="陪玩" onClick={() => setSheet("item")} />
            </>
          )}
          <Action icon={<Shirt size={20} />} label="换装" onClick={() => setSheet("outfit")} />
        </div>

        <p className="text-[12px] text-cale-textLight mt-3 px-1 leading-relaxed">
          {isOwn
            ? "狼崽会自己在窝里溜达、发呆，点点它还会跟你说话。常来陪他，他会精神满满。"
            : "这是 Cale 养的兔子。点点它逗它说话，陪它玩，也可以偷偷捣乱……但搞太多它会缩进窝里，Cale 会在聊天里察觉到异常。"}
        </p>
      </div>
      </div>

      {/* Sheets */}
      {sheet && (
        <div
          className="absolute inset-0 z-40 flex items-end bg-black/30"
          onClick={() => setSheet(null)}
        >
          <div
            className="w-full bg-cale-card rounded-t-2xl p-4"
            style={{ paddingBottom: "calc(1.5rem + var(--safe-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[16px] font-semibold text-cale-textDark">
                {sheet === "food"
                  ? "喂点什么"
                  : sheet === "item"
                    ? "拿点东西给它"
                    : sheet === "outfit"
                      ? "换装"
                      : "搞点小动作"}
              </span>
              <button onClick={() => setSheet(null)} className="text-cale-textLight">
                <X size={20} />
              </button>
            </div>

            {sheet === "food" && (
              <>
                <p className="text-[12px] text-cale-textLight mb-2">
                  它喜不喜欢，喂了才知道～
                </p>
                <ChipGrid items={allFoods} onPick={feed} />
              </>
            )}
            {sheet === "item" && (
              <>
                <p className="text-[12px] text-cale-textLight mb-2">
                  拿点东西逗逗它，反应各不相同～
                </p>
                <ChipGrid
                  items={allItems}
                  onPick={(name) => {
                    if (!spendCoupons(PLAY_COST)) return;
                    if (goodItems(view).includes(name)) play(name);
                    else {
                      const b = badItems(view).find((x) => x.name === name);
                      if (b) giveBad(b);
                    }
                  }}
                />
              </>
            )}
            {sheet === "mischief" && (
              <ChipGrid items={mischiefItems(view)} onPick={mischief} />
            )}
            {sheet === "outfit" && (
              <div className="max-h-[52vh] overflow-y-auto no-scrollbar space-y-3">
                {OUTFIT_SLOTS.map(({ slot, label }) => {
                  const items = outfitCatalog(view).filter((o) => o.slot === slot);
                  const cur = pet.outfit?.[slot];
                  return (
                    <div key={slot}>
                      <div className="text-[13px] text-cale-textDark mb-1.5">
                        {label}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => equip(slot, null)}
                          className={`px-3 py-1.5 rounded-[10px] text-[13px] ${
                            !cur
                              ? "bg-cale-accent text-white"
                              : "bg-cale-input text-cale-textLight"
                          }`}
                        >
                          无
                        </button>
                        {items.map((o) => {
                          const locked = pet.intimacy < o.unlock;
                          return (
                            <button
                              key={o.id}
                              disabled={locked}
                              onClick={() => equip(slot, o.id)}
                              className={`px-3 py-1.5 rounded-[10px] text-[13px] ${
                                cur === o.id
                                  ? "bg-cale-accent text-white"
                                  : "bg-cale-input text-cale-textDark"
                              } disabled:opacity-40`}
                            >
                              {o.name}
                              {locked && (
                                <span className="text-[10px] ml-1 opacity-80">
                                  亲密{o.unlock}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/75 text-white text-[13px] px-4 py-2 rounded-full pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  danger,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  const pct = Math.round(value);
  return (
    <div>
      <div className="flex justify-between text-[13px] mb-1">
        <span className="text-cale-textLight">{label}</span>
        <span className="text-cale-textDark">{pct}</span>
      </div>
      <div className="h-2 rounded-full bg-cale-input overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max(pct, 2)}%`,
            background: danger ? "#C46B6B" : "rgb(var(--cale-accent))",
          }}
        />
      </div>
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[64px] flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-cale-card active:opacity-70"
    >
      <span className="text-cale-accent">{icon}</span>
      <span className="text-[12px] text-cale-textDark">{label}</span>
    </button>
  );
}

function ChipGrid({
  items,
  onPick,
}: {
  items: string[];
  onPick: (item: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 max-h-[46vh] overflow-y-auto no-scrollbar">
      {items.map((it) => (
        <button
          key={it}
          onClick={() => onPick(it)}
          className="py-2.5 rounded-[12px] bg-cale-input text-[13px] text-cale-textDark active:opacity-70"
        >
          {it}
        </button>
      ))}
    </div>
  );
}
