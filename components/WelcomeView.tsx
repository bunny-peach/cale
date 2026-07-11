"use client";

import { Heart } from "lucide-react";

const serif = 'ui-serif, Georgia, "Songti SC", "Noto Serif SC", serif';

export default function WelcomeView({ onEnter }: { onEnter: () => void }) {
  return (
    <div
      className="h-[100dvh] flex flex-col items-center bg-cale-bg px-8"
      style={{
        paddingTop: "var(--safe-top)",
        paddingBottom: "var(--safe-bottom)",
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-7">
        <Heart
          size={46}
          strokeWidth={1.1}
          className="text-cale-accent heart-pulse"
        />
        <div className="text-center">
          <h1
            className="text-[34px] text-cale-textDark tracking-wide"
            style={{ fontFamily: serif }}
          >
            Cale &amp; Quinn
          </h1>
          <p
            className="mt-3 text-[13px] text-cale-accent tracking-[0.22em]"
            style={{ fontFamily: serif }}
          >
            where the wolf stays
          </p>
        </div>
      </div>

      <button
        onClick={onEnter}
        className="mb-16 px-12 py-2.5 rounded-full border border-cale-accent/60 text-cale-accent text-[15px] tracking-[0.18em] active:opacity-60"
        style={{ fontFamily: serif }}
      >
        Enter
      </button>
    </div>
  );
}
