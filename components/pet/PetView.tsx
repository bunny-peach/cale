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
  NotebookPen,
  StickyNote,
  Send,
  ChevronLeft,
  Trophy,
  Gamepad2,
} from "lucide-react";
import { useApp } from "@/components/AppContext";
import { load, save, KEYS, todayKey, uid } from "@/lib/storage";
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
import {
  daypart as getDaypart,
  season as getSeason,
  holiday as getHoliday,
  weatherKind as getWeatherKind,
  seasonParticle,
  ambientCaption,
} from "@/lib/petAmbient";
import {
  DayTally,
  DiaryEntry,
  PetDiaries,
  emptyTally,
  genDiaryEntry,
} from "@/lib/petDiary";
import { PetNotes, emptyNotes, noteColor } from "@/lib/petNotes";
import {
  AchProgress,
  ACHIEVEMENTS,
  freshProgress,
  newlyUnlocked,
} from "@/lib/petAchievements";
import { WolfArt, RabbitArt } from "./PetArt";
import PetGames from "./PetGames";

interface TallyState {
  date: string;
  wolf: DayTally;
  rabbit: DayTally;
}

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
  const { petState, setPetState, weather, todayMood } = useApp();
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
  const [tally, setTally] = useState<TallyState>(() => ({
    date: todayKey(),
    wolf: emptyTally(),
    rabbit: emptyTally(),
  }));
  const [diaries, setDiaries] = useState<PetDiaries>({ wolf: [], rabbit: [] });
  const [journalOpen, setJournalOpen] = useState(false);
  const [notes, setNotes] = useState<PetNotes>(emptyNotes());
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [ach, setAch] = useState<AchProgress>(freshProgress);
  const [achOpen, setAchOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);

  const bumpPetMood = (kind: PetKind, delta: number) =>
    setPetState((prev) => ({
      ...prev,
      [kind]: {
        ...prev[kind],
        mood: Math.max(0, Math.min(100, prev[kind].mood + delta)),
        intimacy: prev[kind].intimacy + 1,
        updatedAt: Date.now(),
      },
    }));

  useEffect(() => {
    setNotes(load<PetNotes>(KEYS.petNotes, emptyNotes()));
  }, []);

  // Apply a patch to achievement progress, unlock anything newly satisfied,
  // and toast the first new badge.
  const recordAch = (patch: (p: AchProgress) => AchProgress) => {
    setAch((prev) => {
      const next = patch({ ...prev });
      const fresh = newlyUnlocked(next);
      if (fresh.length) {
        const now = Date.now();
        fresh.forEach((id) => (next.unlocked[id] = now));
        const first = ACHIEVEMENTS.find((a) => a.id === fresh[0]);
        if (first) setTimeout(() => showToast(`解锁成就：${first.name} ${first.emoji}`), 300);
      }
      save(KEYS.petAch, next);
      return next;
    });
  };

  // Mount: count the daily visit streak, birthday, and sync note total.
  useEffect(() => {
    const today = todayKey();
    const savedNotes = load<PetNotes>(KEYS.petNotes, emptyNotes());
    const noteTotal = savedNotes.toCale.length + savedNotes.toQuinn.length;
    recordAch((p) => {
      const loaded = load<AchProgress>(KEYS.petAch, freshProgress());
      const n = { ...loaded };
      if (n.visitLast !== today) {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        const yk = todayKey(y);
        n.visitDays = n.visitLast === yk ? n.visitDays + 1 : 1;
        n.visitLast = today;
      }
      n.notes = Math.max(n.notes, noteTotal);
      const now = new Date();
      if (now.getMonth() === 3 && now.getDate() === 20) n.birthday = true;
      return n;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quinn leaves a note for Cale (written on the rabbit / Cale side).
  const addNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    setNotes((prev) => {
      const next = {
        ...prev,
        toCale: [{ id: uid(), text, at: Date.now() }, ...prev.toCale].slice(0, 60),
      };
      save(KEYS.petNotes, next);
      recordAch((p) => ({
        ...p,
        notes: next.toCale.length + next.toQuinn.length,
      }));
      return next;
    });
    setNoteDraft("");
  };
  // Notes shown on the current side: wolf side = Cale's notes to Quinn.
  const sideNotes = view === "wolf" ? notes.toQuinn : notes.toCale;

  // Load diary + daily tally; roll over any finished day into a diary entry.
  useEffect(() => {
    const today = todayKey();
    const savedDiary = load<PetDiaries>(KEYS.petDiary, { wolf: [], rabbit: [] });
    const savedTally = load<TallyState>(KEYS.petTally, {
      date: today,
      wolf: emptyTally(),
      rabbit: emptyTally(),
    });
    if (savedTally.date !== today) {
      // finalise the previous day into a diary entry for each pet
      (["wolf", "rabbit"] as PetKind[]).forEach((k) => {
        const has = savedDiary[k].some((e) => e.date === savedTally.date);
        if (!has) {
          savedDiary[k] = [
            { date: savedTally.date, text: genDiaryEntry(k, savedTally[k]) },
            ...savedDiary[k],
          ].slice(0, 120);
        }
      });
      save(KEYS.petDiary, savedDiary);
      const fresh: TallyState = { date: today, wolf: emptyTally(), rabbit: emptyTally() };
      save(KEYS.petTally, fresh);
      setTally(fresh);
    } else {
      setTally(savedTally);
    }
    setDiaries(savedDiary);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Record an interaction into today's tally for the current pet.
  const bump = (field: keyof DayTally, amount = 1) => {
    setTally((prev) => {
      const cur = prev.date === todayKey() ? prev : { date: todayKey(), wolf: emptyTally(), rabbit: emptyTally() };
      const petT = { ...cur[view], came: true, [field]: (cur[view][field] as number) + amount };
      const next = { ...cur, [view]: petT };
      save(KEYS.petTally, next);
      return next;
    });
  };

  // Today's live entry (past days are already finalised in `diaries`).
  const journalEntries = (k: PetKind): DiaryEntry[] => {
    const t = tally[k];
    const live =
      t.came || t.mischief || t.badItem
        ? [{ date: todayKey(), text: genDiaryEntry(k, t) }]
        : [];
    return [...live, ...diaries[k]];
  };

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

  // ---- Ambient context: time of day / weather / season / holiday / mood ----
  const daypart = useMemo(() => getDaypart(), []);
  const seasonNow = useMemo(() => getSeason(), []);
  const holidayNow = useMemo(() => getHoliday(), []);
  const wKind = useMemo(
    () => getWeatherKind(weather?.desc),
    [weather?.desc]
  );
  const particle = seasonParticle(seasonNow, wKind);
  const sleeping = daypart === "night" && !grumpy && !hiding;
  const ambient = ambientCaption({
    kind: view,
    daypart,
    season: seasonNow,
    weather: wKind,
    holiday: holidayNow,
    mood: todayMood?.mood,
  });
  const cappuccino = useMemo(() => Math.random() < 0.12, []);
  const visit = useMemo<Visit>(() => rollVisit(petState), []);

  // Count a 串门 event (and the both-disappear egg) toward achievements.
  useEffect(() => {
    if (visit)
      recordAch((p) => ({
        ...p,
        visits: p.visits + 1,
        bothEgg: p.bothEgg + (visit === "both" ? 1 : 0),
      }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    !sleeping &&
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
    // Fast asleep at night: a poke just makes it roll over, doesn't wake it.
    if (sleeping) {
      setActivity(null);
      setReaction({ anim: "pet-nod", key: Date.now() });
      setSpeech(view === "wolf" ? "（翻了个身，没醒）" : "（动了动耳朵，睡得正香）");
      if (speechTimer.current) clearTimeout(speechTimer.current);
      speechTimer.current = setTimeout(() => setSpeech(null), 2000);
      return;
    }
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
      bump("special");
      if (food === "巧克力") recordAch((p) => ({ ...p, choco: p.choco + 1 }));
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
    bump("fed");
    if (tier === "like") bump("fedLike");
    if (tier === "dislike") bump("fedDislike");
    const uniq = (arr: string[]) => (arr.includes(food) ? arr : [...arr, food]);
    if (tier === "like" || tier === "dislike")
      recordAch((p) =>
        view === "wolf"
          ? {
              ...p,
              likedW: tier === "like" ? uniq(p.likedW) : p.likedW,
              dislikedW: tier === "dislike" ? uniq(p.dislikedW) : p.dislikedW,
            }
          : {
              ...p,
              likedR: tier === "like" ? uniq(p.likedR) : p.likedR,
              dislikedR: tier === "dislike" ? uniq(p.dislikedR) : p.dislikedR,
            }
      );
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
    bump("play");
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
    bump("badItem");
    if (view === "rabbit")
      recordAch((p) => ({
        ...p,
        badR: p.badR.includes(item.name) ? p.badR : [...p.badR, item.name],
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
    bump("mischief");
    recordAch((p) => ({ ...p, mischief: p.mischief + 1 }));
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
    bump("pat");
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
    bump("tease");
    react2("pet-wiggle", pick(["再来再来！", "嘿嘿，抓不到我～", "（原地转圈）"]), "star");
  };

  const equip = (slot: OutfitSlot, id: string | null) => {
    mutate((p) => {
      const outfit = { ...(p.outfit || {}) };
      if (id) outfit[slot] = id;
      else delete outfit[slot];
      return { ...p, outfit };
    });
    if (id) bump("dressed");
  };

  const PetSprite = ({ size }: { size?: number }) =>
    view === "wolf" ? (
      <WolfArt
        pose={presence.pose}
        outfit={pet.outfit}
        hold={activity?.prop}
        sleeping={sleeping}
        size={size}
      />
    ) : (
      <RabbitArt
        grumpy={grumpy}
        hiding={hiding}
        happy={pet.mood >= 85}
        sleeping={sleeping}
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
        <button
          onClick={() => setGamesOpen(true)}
          className="absolute left-2 w-9 h-9 flex items-center justify-center text-cale-accent active:opacity-60"
          style={{ top: "calc(var(--safe-top) + 0.35rem)" }}
          aria-label="小游戏"
        >
          <Gamepad2 size={20} strokeWidth={1.9} />
        </button>
        <button
          onClick={() => setNotesOpen(true)}
          className="absolute right-11 w-9 h-9 flex items-center justify-center text-cale-accent active:opacity-60"
          style={{ top: "calc(var(--safe-top) + 0.35rem)" }}
          aria-label="留言条"
        >
          <StickyNote size={20} strokeWidth={1.9} />
        </button>
        <button
          onClick={() => {
            setJournalOpen(true);
            recordAch((p) => ({ ...p, peeked: true }));
          }}
          className="absolute right-2 w-9 h-9 flex items-center justify-center text-cale-accent active:opacity-60"
          style={{ top: "calc(var(--safe-top) + 0.35rem)" }}
          aria-label="宠物日记"
        >
          <NotebookPen size={20} strokeWidth={1.9} />
        </button>
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
          {/* seasonal falling particles (petals / leaves / snow) */}
          {particle && (
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
              {Array.from({ length: 11 }).map((_, i) => (
                <span
                  key={i}
                  className="pet-particle"
                  style={{
                    left: `${(i * 8.7 + 3) % 95}%`,
                    fontSize: particle === "snow" ? 12 : 15,
                    animationDuration: `${5 + (i % 4)}s`,
                    // negative delay → already mid-fall on mount, so particles
                    // are always spread across the stage instead of bunched up.
                    animationDelay: `-${(i * 0.9).toFixed(1)}s`,
                  }}
                >
                  {particle === "petal" ? "🌸" : particle === "leaf" ? "🍂" : "❄️"}
                </span>
              ))}
            </div>
          )}

          {/* holiday banner + little decoration */}
          {holidayNow && (
            <div className="absolute top-2 left-2 z-20 text-[11px] bg-cale-accent/15 text-cale-accent rounded-full px-2 py-0.5 font-medium">
              🎉 {holidayNow.name}
            </div>
          )}
          {holidayNow && !awayHere && (
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 text-[26px] pointer-events-none">
              {holidayNow.key === "birthday"
                ? "🎂"
                : holidayNow.key === "valentine"
                  ? "🍑"
                  : holidayNow.key === "christmas"
                    ? "🎄"
                    : holidayNow.key === "newyear"
                      ? "🎆"
                      : "🎃"}
            </div>
          )}

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
                  : hiding
                    ? "炸毛了！缩成一团埋进窝里，怎么哄都不出来"
                    : grumpy
                      ? "气鼓鼓地缩进窝里，不太理人"
                      : ambient ??
                        (view === "wolf"
                          ? activity?.caption ?? presence.caption
                          : activity?.caption ??
                            "软乎乎的，正竖着耳朵看你（点点它）")}
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

        {/* Badge shelf by the nest */}
        <button
          onClick={() => setAchOpen(true)}
          className="w-full bg-cale-card rounded-[16px] px-4 py-3 mt-3 flex items-center gap-2 active:opacity-80"
        >
          <Trophy size={16} className="text-cale-accent flex-shrink-0" />
          <span className="text-[13px] text-cale-textDark flex-shrink-0">成就徽章</span>
          <div className="flex-1 flex gap-1 justify-end items-center overflow-hidden">
            {ACHIEVEMENTS.filter((a) => ach.unlocked[a.id]).length === 0 ? (
              <span className="text-[12px] text-cale-textLight">还没有徽章～</span>
            ) : (
              ACHIEVEMENTS.filter((a) => ach.unlocked[a.id])
                .slice(0, 7)
                .map((a) => (
                  <span key={a.id} className="text-[17px] leading-none">
                    {a.emoji}
                  </span>
                ))
            )}
          </div>
          <span className="text-[12px] text-cale-textLight flex-shrink-0">
            {ACHIEVEMENTS.filter((a) => ach.unlocked[a.id]).length}/{ACHIEVEMENTS.length}
          </span>
        </button>

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

      {/* Pet diary overlay */}
      {journalOpen && (
        <div className="absolute inset-0 z-40 flex flex-col app-bg">
          <header
            className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-2 h-12"
            style={{ paddingTop: "var(--safe-top)" }}
          >
            <button
              onClick={() => setJournalOpen(false)}
              className="w-9 h-9 flex items-center justify-center text-cale-accent active:opacity-60"
              aria-label="返回"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex-1 text-center text-[16px] font-semibold pr-9">
              {view === "wolf" ? "狼崽的日记" : "兔子的日记"}
            </div>
          </header>
          <div className="flex-shrink-0 px-4 pt-3">
            <div className="flex bg-cale-input rounded-full p-0.5 text-[14px]">
              {(["wolf", "rabbit"] as PetKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`flex-1 py-1.5 rounded-full transition-colors ${
                    view === k
                      ? "bg-cale-card text-cale-accent font-medium shadow-sm"
                      : "text-cale-textLight"
                  }`}
                >
                  {k === "wolf" ? "狼崽" : "兔子"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-3">
            {journalEntries(view).length === 0 && (
              <div className="text-center text-cale-textLight text-[13px] mt-16">
                还没有日记～ 陪它相处几天就有啦
              </div>
            )}
            {journalEntries(view).map((e, i) => (
              <div key={e.date + i} className="bg-cale-card rounded-[14px] p-4">
                <div className="text-[11px] text-cale-textLight mb-1.5">
                  {e.date}
                  {i === 0 && journalEntries(view)[0].date === todayKey() && (
                    <span className="ml-1.5 text-cale-accent">· 今天</span>
                  )}
                </div>
                <p
                  className="text-[14px] text-cale-textDark leading-relaxed"
                  style={{ fontFamily: 'ui-serif, "Songti SC", "Noto Serif SC", serif' }}
                >
                  {e.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky notes overlay */}
      {notesOpen && (
        <div className="absolute inset-0 z-40 flex flex-col app-bg">
          <header
            className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-2 h-12"
            style={{ paddingTop: "var(--safe-top)" }}
          >
            <button
              onClick={() => setNotesOpen(false)}
              className="w-9 h-9 flex items-center justify-center text-cale-accent active:opacity-60"
              aria-label="返回"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex-1 text-center text-[16px] font-semibold pr-9">
              留言条
            </div>
          </header>
          <div className="flex-shrink-0 px-4 pt-3">
            <div className="flex bg-cale-input rounded-full p-0.5 text-[14px]">
              {(["wolf", "rabbit"] as PetKind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setView(k)}
                  className={`flex-1 py-1.5 rounded-full transition-colors ${
                    view === k
                      ? "bg-cale-card text-cale-accent font-medium shadow-sm"
                      : "text-cale-textLight"
                  }`}
                >
                  {k === "wolf" ? "Cale 给你的" : "你写给 Cale 的"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
            <p className="text-[12px] text-cale-textLight mb-3 px-1">
              {view === "wolf"
                ? "Cale 悄悄贴在窝旁的纸条，聊天时也可能留下新的。"
                : "写一张便签贴在窝边，Cale 会看到。"}
            </p>
            {sideNotes.length === 0 && (
              <div className="text-center text-cale-textLight text-[13px] mt-12">
                {view === "wolf" ? "还没有 Cale 的便签～" : "还没有便签，写一张贴上吧～"}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {sideNotes.map((n, i) => (
                <div
                  key={n.id}
                  className="rounded-[10px] p-3 shadow-sm"
                  style={{
                    background: noteColor(n.id),
                    transform: `rotate(${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg)`,
                  }}
                >
                  <p
                    className="text-[14px] text-[#5a4a42] leading-relaxed break-words"
                    style={{ fontFamily: '"Xingkai SC", "Kaiti SC", "STKaiti", cursive' }}
                  >
                    {n.text}
                  </p>
                  <div className="text-[10px] text-[#5a4a42]/50 mt-2 text-right">
                    {new Date(n.at).toLocaleDateString("zh-CN")}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {view === "rabbit" && (
            <div
              className="flex-shrink-0 bg-cale-card border-t border-cale-divider px-3 pt-2 flex items-end gap-2"
              style={{ paddingBottom: "calc(0.5rem + var(--safe-bottom))" }}
            >
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={1}
                placeholder="写点什么贴给 Cale…"
                className="flex-1 bg-cale-input rounded-[18px] px-4 py-2 text-[16px] outline-none resize-none max-h-24 no-scrollbar placeholder:text-cale-textLight"
              />
              <button
                onClick={addNote}
                disabled={!noteDraft.trim()}
                className="flex-shrink-0 w-9 h-9 mb-0.5 rounded-full bg-cale-accent text-white flex items-center justify-center disabled:opacity-40"
                aria-label="贴上"
              >
                <Send size={17} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Achievements overlay */}
      {achOpen && (
        <div className="absolute inset-0 z-40 flex flex-col app-bg">
          <header
            className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-2 h-12"
            style={{ paddingTop: "var(--safe-top)" }}
          >
            <button
              onClick={() => setAchOpen(false)}
              className="w-9 h-9 flex items-center justify-center text-cale-accent active:opacity-60"
              aria-label="返回"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex-1 text-center text-[16px] font-semibold pr-9">
              成就徽章 {ACHIEVEMENTS.filter((a) => ach.unlocked[a.id]).length}/
              {ACHIEVEMENTS.length}
            </div>
          </header>
          <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-2.5">
            {ACHIEVEMENTS.map((a) => {
              const on = !!ach.unlocked[a.id];
              return (
                <div
                  key={a.id}
                  className={`bg-cale-card rounded-[14px] p-3.5 flex items-center gap-3 ${on ? "" : "opacity-55"}`}
                >
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-[22px] flex-shrink-0 ${on ? "bg-cale-accent/12" : "bg-cale-input"}`}
                    style={{ filter: on ? "none" : "grayscale(1)" }}
                  >
                    {a.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-cale-textDark">
                      {a.name}
                      {!on && (
                        <span className="text-[11px] text-cale-textLight ml-1.5">未解锁</span>
                      )}
                    </div>
                    <div className="text-[12px] text-cale-textLight mt-0.5">{a.desc}</div>
                  </div>
                  {on && (
                    <div className="text-[10px] text-cale-textLight flex-shrink-0">
                      {new Date(ach.unlocked[a.id]).toLocaleDateString("zh-CN")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {gamesOpen && (
        <PetGames onClose={() => setGamesOpen(false)} bumpMood={bumpPetMood} />
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
