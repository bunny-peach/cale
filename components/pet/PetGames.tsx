"use client";

import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import { PetKind } from "@/lib/pets";
import { WolfArt, RabbitArt } from "./PetArt";

type Game = "menu" | "ball" | "seek" | "tug" | "cups";

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export default function PetGames({
  onClose,
  bumpMood,
}: {
  onClose: () => void;
  bumpMood: (kind: PetKind, delta: number) => void;
}) {
  const [game, setGame] = useState<Game>("menu");

  return (
    <div className="absolute inset-0 z-40 flex flex-col app-bg">
      <header
        className="flex-shrink-0 bg-cale-card border-b border-cale-divider flex items-center px-2 h-12"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <button
          onClick={() => (game === "menu" ? onClose() : setGame("menu"))}
          className="w-9 h-9 flex items-center justify-center text-cale-accent active:opacity-60"
          aria-label="返回"
        >
          {game === "menu" ? <X size={20} /> : <ChevronLeft size={22} />}
        </button>
        <div className="flex-1 text-center text-[16px] font-semibold pr-9">
          {game === "menu"
            ? "小游戏"
            : game === "ball"
              ? "丢球"
              : game === "seek"
                ? "躲猫猫"
                : game === "tug"
                  ? "拔河"
                  : "猜猜在哪"}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4">
        {game === "menu" && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { k: "ball", emoji: "🎾", name: "丢球", d: "丢给狼崽，他叼回来" },
              { k: "seek", emoji: "🌿", name: "躲猫猫", d: "找出藏起来的兔子" },
              { k: "tug", emoji: "🪢", name: "拔河", d: "和狼崽抢一根绳子" },
              { k: "cups", emoji: "🥤", name: "猜猜在哪", d: "猜食物在哪个杯子下" },
            ].map((g) => (
              <button
                key={g.k}
                onClick={() => setGame(g.k as Game)}
                className="bg-cale-card rounded-[16px] p-4 flex flex-col items-center gap-2 active:opacity-80"
              >
                <span className="text-[34px]">{g.emoji}</span>
                <span className="text-[14px] font-medium text-cale-textDark">{g.name}</span>
                <span className="text-[11px] text-cale-textLight text-center leading-snug">
                  {g.d}
                </span>
              </button>
            ))}
          </div>
        )}
        {game === "ball" && <BallGame bumpMood={bumpMood} />}
        {game === "seek" && <SeekGame bumpMood={bumpMood} />}
        {game === "tug" && <TugGame bumpMood={bumpMood} />}
        {game === "cups" && <CupsGame bumpMood={bumpMood} />}
      </div>
    </div>
  );
}

function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cale-card rounded-[18px] p-5 flex flex-col items-center gap-4 min-h-[300px] justify-center">
      {children}
    </div>
  );
}
function GameBtn({ onClick, children, disabled }: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2.5 rounded-full bg-cale-accent text-white text-[15px] font-medium active:opacity-80 disabled:opacity-50"
    >
      {children}
    </button>
  );
}
function Caption({ children }: { children: React.ReactNode }) {
  return <div className="text-[14px] text-cale-textDark text-center min-h-[20px]">{children}</div>;
}

// ---- 丢球 ----
function BallGame({ bumpMood }: { bumpMood: (k: PetKind, d: number) => void }) {
  const [state, setState] = useState<"idle" | "fetching" | "done">("idle");
  const [result, setResult] = useState<{ emoji: string; line: string } | null>(null);
  const throwBall = () => {
    setState("fetching");
    setResult(null);
    setTimeout(() => {
      const wrong = Math.random() < 0.3;
      if (wrong) {
        const r = pick([
          { emoji: "🧦", line: "叼回来一只袜子…这不是球。" },
          { emoji: "🪵", line: "叼回来一根树枝，很得意。" },
          { emoji: "🎀", line: "叼回来兔子的蝴蝶结！兔子气鼓鼓。" },
        ]);
        setResult(r);
        bumpMood("wolf", 4);
      } else {
        setResult({ emoji: "🎾", line: "稳稳叼回了球！尾巴摇个不停。" });
        bumpMood("wolf", 6);
      }
      setState("done");
    }, 1200);
  };
  return (
    <Stage>
      <div className={state === "fetching" ? "pet-jump" : undefined}>
        <WolfArt pose="happy" size={150} />
      </div>
      {result && <div className="text-[40px]">{result.emoji}</div>}
      <Caption>
        {state === "fetching" ? "（飞奔出去…）" : result ? result.line : "把球丢出去，看他叼回什么～"}
      </Caption>
      <GameBtn onClick={throwBall} disabled={state === "fetching"}>
        {state === "idle" ? "丢出球" : "再丢一次"}
      </GameBtn>
    </Stage>
  );
}

// ---- 躲猫猫 ----
function SeekGame({ bumpMood }: { bumpMood: (k: PetKind, d: number) => void }) {
  const spots = ["🌿", "🧺", "🛖"];
  const [hidden, setHidden] = useState(() => Math.floor(Math.random() * 3));
  const [found, setFound] = useState(false);
  const reset = () => {
    setHidden(Math.floor(Math.random() * 3));
    setFound(false);
  };
  return (
    <Stage>
      {found ? (
        <>
          <div className="pet-jump">
            <RabbitArt happy size={140} />
          </div>
          <Caption>被你找到啦～（蹦出来蹭蹭你）</Caption>
          <GameBtn onClick={reset}>再玩一次</GameBtn>
        </>
      ) : (
        <>
          <Caption>兔子藏起来了，可耳朵总是露在外面…点它的耳朵！</Caption>
          <div className="flex gap-5 mt-2">
            {spots.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i === hidden) {
                    setFound(true);
                    bumpMood("rabbit", 6);
                  }
                }}
                className="relative flex flex-col items-center active:opacity-80"
              >
                {i === hidden && (
                  <span className="text-[22px] leading-none mb-[-6px] relative z-10">🐰</span>
                )}
                <span className="text-[46px]">{s}</span>
              </button>
            ))}
          </div>
          <div className="text-[11px] text-cale-textLight">草堆 · 篮子 · 窝</div>
        </>
      )}
    </Stage>
  );
}

// ---- 拔河 ----
function TugGame({ bumpMood }: { bumpMood: (k: PetKind, d: number) => void }) {
  const [pulls, setPulls] = useState(0);
  const [result, setResult] = useState<null | "win" | "lose">(null);
  const pull = () => {
    const n = pulls + 1;
    setPulls(n);
    if (n >= 3) {
      const win = Math.random() < 0.5;
      setResult(win ? "win" : "lose");
      bumpMood("wolf", win ? 4 : 6);
    }
  };
  const reset = () => {
    setPulls(0);
    setResult(null);
  };
  return (
    <Stage>
      <div className="flex items-center gap-1">
        <WolfArt pose="happy" size={120} />
        <span className="text-[30px]">🪢</span>
        <span className="text-[30px]">🙋</span>
      </div>
      {result ? (
        <>
          <Caption>
            {result === "win" ? "你赢了！狼崽不服气地哼哼。" : "输了！他得意地摇尾巴。"}
          </Caption>
          <GameBtn onClick={reset}>再来一局</GameBtn>
        </>
      ) : (
        <>
          <Caption>连按「用力拔」三下！（{pulls}/3）</Caption>
          <GameBtn onClick={pull}>用力拔！</GameBtn>
        </>
      )}
    </Stage>
  );
}

// ---- 猜猜在哪 ----
function CupsGame({ bumpMood }: { bumpMood: (k: PetKind, d: number) => void }) {
  const [phase, setPhase] = useState<"ready" | "shuffling" | "guess" | "done">("ready");
  const [target, setTarget] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const start = () => {
    setChosen(null);
    setTarget(Math.floor(Math.random() * 3));
    setPhase("shuffling");
    setTimeout(() => setPhase("guess"), 1100);
  };
  const guess = (i: number) => {
    setChosen(i);
    setPhase("done");
    bumpMood("rabbit", i === target ? 6 : 2);
  };
  const correct = chosen === target;
  return (
    <Stage>
      <RabbitArt happy={phase === "done" && correct} grumpy={phase === "done" && !correct} size={110} />
      <div className="flex gap-4">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => phase === "guess" && guess(i)}
            className={`flex flex-col items-center ${phase === "shuffling" ? "cup-shuffle" : ""} ${phase === "guess" ? "active:opacity-70" : ""}`}
            style={{ animationDelay: `${i * 0.12}s` }}
          >
            <span className="text-[46px]">🥤</span>
            {phase === "done" && i === target && <span className="text-[22px] mt-[-8px]">🍑</span>}
          </button>
        ))}
      </div>
      {phase === "ready" && (
        <>
          <Caption>桃子藏在一个杯子下，洗牌后猜猜在哪～</Caption>
          <GameBtn onClick={start}>开始</GameBtn>
        </>
      )}
      {phase === "shuffling" && <Caption>（洗牌中…兔子盯得很认真）</Caption>}
      {phase === "guess" && <Caption>点一个杯子！</Caption>}
      {phase === "done" && (
        <>
          <Caption>
            {correct ? "猜对啦！兔子开心地蹬腿鼓掌。" : "猜错了…兔子嫌弃地转过去。"}
          </Caption>
          <GameBtn onClick={start}>再猜一次</GameBtn>
        </>
      )}
    </Stage>
  );
}
