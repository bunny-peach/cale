"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Utensils, Hand, Sparkles, Ghost, Heart } from "lucide-react";
import { useApp } from "@/components/AppContext";
import { load, KEYS } from "@/lib/storage";
import {
  PetKind,
  Pet,
  foods,
  goodItems,
  mischiefItems,
  foodTier,
  applyDecay,
  petName,
  wolfPresence,
} from "@/lib/pets";
import { WolfArt, RabbitArt } from "./PetArt";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export default function PetView() {
  const { petState, setPetState } = useApp();
  const [view, setView] = useState<PetKind>("wolf");
  const [sheet, setSheet] = useState<null | "food" | "item" | "mischief">(null);
  const [foodTab, setFoodTab] = useState<"like" | "normal" | "dislike">("like");
  const [toast, setToast] = useState<string | null>(null);
  const [bounce, setBounce] = useState(0);

  // Apply idle decay once on mount.
  useEffect(() => {
    setPetState((prev) => ({
      wolf: applyDecay(prev.wolf),
      rabbit: applyDecay(prev.rabbit),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pet = petState[view];
  const isOwn = view === "wolf"; // Quinn 养狼崽；兔子是 Cale 的，可以捣乱
  const lastActive = useMemo(
    () => load<number | null>(KEYS.lastActive, null),
    []
  );
  const presence = wolfPresence(lastActive);
  const grumpy = view === "rabbit" && (pet.mischief >= 60 || pet.mood < 22);

  const showToast = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(null), 1500);
  };
  const react = (t: string) => {
    setBounce((b) => b + 1);
    showToast(t);
  };

  const mutate = (fn: (p: Pet) => Pet) =>
    setPetState((prev) => ({ ...prev, [view]: fn(prev[view]) }));

  const feed = (food: string) => {
    const tier = foodTier(view, food);
    mutate((p) => ({
      ...p,
      fullness: clamp(p.fullness + 15),
      mood: clamp(p.mood + (tier === "like" ? 8 : tier === "dislike" ? -10 : 0)),
      mischief: clamp(p.mischief + (tier === "dislike" && !isOwn ? 8 : 0)),
      intimacy: p.intimacy + 2,
      updatedAt: Date.now(),
    }));
    setSheet(null);
    react(
      tier === "like"
        ? `${petName(view)}吃得很开心`
        : tier === "dislike"
          ? `${petName(view)}皱着脸咽了下去`
          : `${petName(view)}安静地吃完了`
    );
  };

  const play = (item: string) => {
    mutate((p) => ({
      ...p,
      mood: clamp(p.mood + 7),
      intimacy: p.intimacy + 2,
      updatedAt: Date.now(),
    }));
    setSheet(null);
    react(`陪${petName(view)}玩「${item}」，它很喜欢`);
  };

  const mischief = (action: string) => {
    mutate((p) => ({
      ...p,
      mood: clamp(p.mood - 8),
      mischief: clamp(p.mischief + 12),
      updatedAt: Date.now(),
    }));
    setSheet(null);
    react(`你偷偷「${action}」，兔子有点不对劲了…`);
  };

  const headPat = () => {
    mutate((p) => ({
      ...p,
      mood: clamp(p.mood + 5),
      intimacy: p.intimacy + 1,
      updatedAt: Date.now(),
    }));
    react("摸摸头，它蹭了蹭你");
  };
  const tease = () => {
    mutate((p) => ({
      ...p,
      mood: clamp(p.mood + 6),
      intimacy: p.intimacy + 1,
      updatedAt: Date.now(),
    }));
    react("逗了逗它，它兴奋起来");
  };

  return (
    <div className="h-full flex flex-col bg-cale-bg relative overflow-hidden">
      <header
        className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center justify-center h-12"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <div className="text-[17px] font-semibold">宠物小窝</div>
      </header>

      {/* Viewpoint switch */}
      <div className="flex-shrink-0 px-4 pt-3">
        <div className="flex bg-cale-input rounded-full p-0.5 text-[14px]">
          {(["wolf", "rabbit"] as PetKind[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setView(k);
                setSheet(null);
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

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4">
        {/* Pet stage */}
        <div className="bg-cale-card rounded-[18px] py-6 flex flex-col items-center">
          <div
            key={bounce}
            className="cale-pop"
            style={{ animationDuration: "0.35s" }}
          >
            {view === "wolf" ? (
              <WolfArt pose={presence.pose} />
            ) : (
              <RabbitArt grumpy={grumpy} />
            )}
          </div>
          <div className="text-[13px] text-cale-textLight mt-1 px-6 text-center">
            {view === "wolf"
              ? presence.caption
              : grumpy
                ? "气鼓鼓地缩进窝里，不太理人"
                : "软乎乎的，正竖着耳朵看你"}
          </div>
          {view === "wolf" && pet.surprise && (
            <div className="mt-2 text-[12px] text-cale-accent">
              咦？它身上多了：{pet.surprise}
            </div>
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
          {!isOwn && (
            <Stat label="捣乱值" value={pet.mischief} danger />
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-4 gap-2 mt-3">
          <Action
            icon={<Utensils size={20} />}
            label="喂食"
            onClick={() => {
              setFoodTab("like");
              setSheet("food");
            }}
          />
          {isOwn ? (
            <>
              <Action icon={<Hand size={20} />} label="摸头" onClick={headPat} />
              <Action
                icon={<Sparkles size={20} />}
                label="逗他"
                onClick={tease}
              />
              <Action
                icon={<Heart size={20} />}
                label="陪玩"
                onClick={() => setSheet("item")}
              />
            </>
          ) : (
            <>
              <Action
                icon={<Ghost size={20} />}
                label="捣乱"
                onClick={() => setSheet("mischief")}
              />
              <Action
                icon={<Heart size={20} />}
                label="陪玩"
                onClick={() => setSheet("item")}
              />
            </>
          )}
        </div>

        <p className="text-[12px] text-cale-textLight mt-3 px-1 leading-relaxed">
          {isOwn
            ? "狼崽的状态会跟着你们聊天的频率变化——常来陪他，他会精神满满。"
            : "这是 Cale 养的兔子。你可以陪它玩，也可以偷偷捣乱……但搞太多它会生气缩进窝里，Cale 也会在聊天里察觉到异常。"}
        </p>
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
                    ? "陪它玩"
                    : "搞点小动作"}
              </span>
              <button onClick={() => setSheet(null)} className="text-cale-textLight">
                <X size={20} />
              </button>
            </div>

            {sheet === "food" && (
              <>
                <div className="flex bg-cale-input rounded-full p-0.5 text-[13px] mb-3">
                  {(["like", "normal", "dislike"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setFoodTab(t)}
                      className={`flex-1 py-1.5 rounded-full ${
                        foodTab === t
                          ? "bg-cale-card text-cale-accent font-medium"
                          : "text-cale-textLight"
                      }`}
                    >
                      {t === "like" ? "喜欢" : t === "normal" ? "普通" : "讨厌"}
                    </button>
                  ))}
                </div>
                <ChipGrid items={foods(view)[foodTab]} onPick={feed} />
              </>
            )}
            {sheet === "item" && (
              <ChipGrid items={goodItems(view)} onPick={play} />
            )}
            {sheet === "mischief" && (
              <ChipGrid items={mischiefItems(view)} onPick={mischief} />
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
            background: danger
              ? "#C46B6B"
              : "rgb(var(--cale-accent))",
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
      className="flex flex-col items-center gap-1.5 py-3 rounded-[14px] bg-cale-card active:opacity-70"
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
